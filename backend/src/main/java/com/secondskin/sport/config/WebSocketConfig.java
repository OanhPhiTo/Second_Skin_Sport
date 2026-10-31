package com.secondskin.sport.config;

import com.secondskin.sport.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Direct WebSocket endpoint with handshake interceptor
        registry.addEndpoint("/ws/sensor-data")
                .setAllowedOriginPatterns("*")
                .addInterceptors(authHandshakeInterceptor());

        // SockJS fallback endpoint with handshake interceptor
        registry.addEndpoint("/ws/sensor-data")
                .setAllowedOriginPatterns("*")
                .addInterceptors(authHandshakeInterceptor())
                .withSockJS();
    }

    public HandshakeInterceptor authHandshakeInterceptor() {
        return new HandshakeInterceptor() {
            @Override
            public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                           WebSocketHandler wsHandler, Map<String, Object> attributes) {
                // 1. Extract query parameter ?token=...
                URI uri = request.getURI();
                String query = uri.getQuery();
                if (query != null && !query.isEmpty()) {
                    for (String param : query.split("&")) {
                        String[] pair = param.split("=", 2);
                        if (pair.length == 2 && "token".equalsIgnoreCase(pair[0])) {
                            attributes.put("handshake_token", pair[1]);
                            break;
                        }
                    }
                }

                // 2. Extract Authorization header from handshake if present
                List<String> authHeaders = request.getHeaders().get("Authorization");
                if (authHeaders != null && !authHeaders.isEmpty()) {
                    String authHeader = authHeaders.get(0);
                    if (authHeader.startsWith("Bearer ")) {
                        attributes.put("handshake_token", authHeader.substring(7));
                    } else {
                        attributes.put("handshake_token", authHeader);
                    }
                }
                return true;
            }

            @Override
            public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                       WebSocketHandler wsHandler, Exception exception) {
                // No-op
            }
        };
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthChannelInterceptor());
    }

    public ChannelInterceptor stompAuthChannelInterceptor() {
        return new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null || !accessor.isMutable()) {
                    MessageHeaderAccessor mutable = MessageHeaderAccessor.getMutableAccessor(message);
                    if (mutable instanceof StompHeaderAccessor sha) {
                        accessor = sha;
                    } else {
                        accessor = StompHeaderAccessor.wrap(message);
                    }
                }

                StompCommand command = accessor.getCommand();
                if (command == null) {
                    return message;
                }

                // --- 1. HANDLE CONNECT ---
                if (StompCommand.CONNECT.equals(command)) {
                    String token = extractToken(accessor);
                    if (token == null || token.isBlank()) {
                        log.warn("STOMP CONNECT rejected: No token provided");
                        throw new AccessDeniedException("WebSocket STOMP authentication failed: Missing token");
                    }

                    String username;
                    try {
                        username = jwtService.extractUsername(token);
                    } catch (Exception e) {
                        log.warn("STOMP CONNECT rejected: Cannot parse JWT: {}", e.getMessage());
                        throw new AccessDeniedException("WebSocket STOMP authentication failed: Invalid token format or signature");
                    }

                    if (username == null || username.isBlank()) {
                        log.warn("STOMP CONNECT rejected: Username claim missing in JWT");
                        throw new AccessDeniedException("WebSocket STOMP authentication failed: Missing username claim");
                    }

                    UserDetails userDetails;
                    try {
                        userDetails = userDetailsService.loadUserByUsername(username);
                    } catch (Exception e) {
                        log.warn("STOMP CONNECT rejected: User '{}' not found", username);
                        throw new AccessDeniedException("WebSocket STOMP authentication failed: User not found");
                    }

                    if (!jwtService.isTokenValid(token, userDetails)) {
                        log.warn("STOMP CONNECT rejected: Token is expired or invalid for user '{}'", username);
                        throw new AccessDeniedException("WebSocket STOMP authentication failed: Token expired or invalid");
                    }

                    if (!userDetails.isEnabled()) {
                        log.warn("STOMP CONNECT rejected: User '{}' account is disabled/banned", username);
                        throw new AccessDeniedException("WebSocket STOMP authentication failed: User account is disabled or banned");
                    }

                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

                    accessor.setUser(authentication);
                    if (accessor.getSessionAttributes() != null) {
                        accessor.getSessionAttributes().put("SPRING_SECURITY_CONTEXT", authentication);
                    }
                    log.info("STOMP CONNECT authenticated successfully for user '{}' with role(s) {}", username, userDetails.getAuthorities());
                    return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
                }

                // --- 2. HANDLE SUBSCRIBE ---
                if (StompCommand.SUBSCRIBE.equals(command)) {
                    Principal principal = resolvePrincipal(accessor);
                    if (principal == null || !(principal instanceof Authentication auth) || !auth.isAuthenticated()) {
                        log.warn("STOMP SUBSCRIBE rejected: Unauthenticated client attempted subscription to {}", accessor.getDestination());
                        throw new AccessDeniedException("WebSocket STOMP: Subscription denied - authentication required");
                    }

                    String destination = accessor.getDestination();
                    if (destination != null) {
                        // Tactical coach topics require ROLE_COACH or ROLE_ADMIN
                        if (destination.startsWith("/topic/coach/")) {
                            boolean isCoachOrAdmin = auth.getAuthorities().stream().anyMatch(granted ->
                                    "ROLE_COACH".equals(granted.getAuthority()) || "ROLE_ADMIN".equals(granted.getAuthority())
                            );
                            if (!isCoachOrAdmin) {
                                log.warn("STOMP SUBSCRIBE rejected: User '{}' lacks COACH/ADMIN role for destination {}", auth.getName(), destination);
                                throw new AccessDeniedException("WebSocket STOMP: Access denied - only COACH or ADMIN may subscribe to " + destination);
                            }
                        }
                    }
                    return message;
                }

                // --- 3. HANDLE SEND ---
                if (StompCommand.SEND.equals(command)) {
                    Principal principal = resolvePrincipal(accessor);
                    if (principal == null || !(principal instanceof Authentication auth) || !auth.isAuthenticated()) {
                        log.warn("STOMP SEND rejected: Unauthenticated client attempted send");
                        throw new AccessDeniedException("WebSocket STOMP: Send denied - authentication required");
                    }
                    return message;
                }

                return message;
            }

            private String extractToken(StompHeaderAccessor accessor) {
                // 1. Native STOMP header: Authorization: Bearer <token>
                String authHeader = accessor.getFirstNativeHeader("Authorization");
                if (authHeader != null && !authHeader.isBlank()) {
                    if (authHeader.startsWith("Bearer ")) {
                        return authHeader.substring(7).trim();
                    }
                    return authHeader.trim();
                }

                // 2. Native STOMP header: token: <token>
                String tokenHeader = accessor.getFirstNativeHeader("token");
                if (tokenHeader != null && !tokenHeader.isBlank()) {
                    return tokenHeader.trim();
                }

                // 3. Handshake session attributes: handshake_token or token
                Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                if (sessionAttributes != null) {
                    Object handshakeToken = sessionAttributes.get("handshake_token");
                    if (handshakeToken instanceof String ht && !ht.isBlank()) {
                        return ht.trim();
                    }
                    Object queryToken = sessionAttributes.get("token");
                    if (queryToken instanceof String qt && !qt.isBlank()) {
                        return qt.trim();
                    }
                }
                return null;
            }

            private Principal resolvePrincipal(StompHeaderAccessor accessor) {
                Principal principal = accessor.getUser();
                if (principal == null && accessor.getSessionAttributes() != null) {
                    Object saved = accessor.getSessionAttributes().get("SPRING_SECURITY_CONTEXT");
                    if (saved instanceof Principal p) {
                        principal = p;
                        accessor.setUser(principal);
                    }
                }
                return principal;
            }
        };
    }
}
