package com.secondskin.sport.security;

import com.secondskin.sport.config.WebSocketConfig;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WebSocketSecurityTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private MessageChannel messageChannel;

    private WebSocketConfig webSocketConfig;
    private ChannelInterceptor interceptor;

    private User athleteUser;
    private User coachUser;
    private User disabledUser;

    @BeforeEach
    void setUp() {
        webSocketConfig = new WebSocketConfig(jwtService, userDetailsService);
        interceptor = webSocketConfig.stompAuthChannelInterceptor();

        athleteUser = new User("Athlete", "athlete@secondskin.io", "pass", Role.USER, "Running");
        athleteUser.setId(1L);

        coachUser = new User("Coach", "coach@secondskin.io", "pass", Role.COACH, "Basketball");
        coachUser.setId(2L);

        disabledUser = new User("Banned", "banned@secondskin.io", "pass", Role.USER, "Tennis");
        disabledUser.setId(3L);
        disabledUser.setEnabled(false);
    }

    @Test
    @DisplayName("CONNECT with valid Bearer token should authenticate successfully")
    void testConnectWithValidBearerToken() {
        String token = "valid.jwt.token";
        when(jwtService.extractUsername(token)).thenReturn("athlete@secondskin.io");
        when(userDetailsService.loadUserByUsername("athlete@secondskin.io")).thenReturn(athleteUser);
        when(jwtService.isTokenValid(token, athleteUser)).thenReturn(true);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        accessor.addNativeHeader("Authorization", "Bearer " + token);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, messageChannel);
        assertNotNull(result);

        StompHeaderAccessor resAccessor = MessageHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);
        assertNotNull(resAccessor);
        assertNotNull(resAccessor.getUser());
        assertEquals("athlete@secondskin.io", resAccessor.getUser().getName());
    }

    @Test
    @DisplayName("CONNECT with valid query parameter in session attributes should authenticate successfully")
    void testConnectWithValidHandshakeToken() {
        String token = "handshake.jwt.token";
        when(jwtService.extractUsername(token)).thenReturn("coach@secondskin.io");
        when(userDetailsService.loadUserByUsername("coach@secondskin.io")).thenReturn(coachUser);
        when(jwtService.isTokenValid(token, coachUser)).thenReturn(true);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        Map<String, Object> sessionAttrs = new HashMap<>();
        sessionAttrs.put("handshake_token", token);
        accessor.setSessionAttributes(sessionAttrs);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, messageChannel);
        assertNotNull(result);

        StompHeaderAccessor resAccessor = MessageHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);
        assertNotNull(resAccessor);
        assertNotNull(resAccessor.getUser());
        assertEquals("coach@secondskin.io", resAccessor.getUser().getName());
    }

    @Test
    @DisplayName("CONNECT with missing token should throw AccessDeniedException")
    void testConnectMissingTokenThrowsException() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(message, messageChannel));
    }

    @Test
    @DisplayName("CONNECT with disabled user account should throw AccessDeniedException")
    void testConnectDisabledUserThrowsException() {
        String token = "banned.jwt.token";
        when(jwtService.extractUsername(token)).thenReturn("banned@secondskin.io");
        when(userDetailsService.loadUserByUsername("banned@secondskin.io")).thenReturn(disabledUser);
        when(jwtService.isTokenValid(token, disabledUser)).thenReturn(true);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer " + token);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(message, messageChannel));
    }

    @Test
    @DisplayName("SUBSCRIBE to /topic/coach/** by USER role should throw AccessDeniedException")
    void testSubscribeCoachTopicByUserRoleThrowsException() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/coach/teams/1/tactical");
        accessor.setUser(new UsernamePasswordAuthenticationToken(athleteUser, null, athleteUser.getAuthorities()));
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(message, messageChannel));
    }

    @Test
    @DisplayName("SUBSCRIBE to /topic/coach/** by COACH role should succeed")
    void testSubscribeCoachTopicByCoachRoleSucceeds() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/coach/teams/1/tactical");
        accessor.setUser(new UsernamePasswordAuthenticationToken(coachUser, null, coachUser.getAuthorities()));
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, messageChannel);
        assertNotNull(result);
    }

    @Test
    @DisplayName("SUBSCRIBE without authentication should throw AccessDeniedException")
    void testSubscribeWithoutAuthenticationThrowsException() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/sensor-telemetry");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(message, messageChannel));
    }

    @Test
    @DisplayName("SUBSCRIBE to /topic/sensor-telemetry by authenticated USER should succeed")
    void testSubscribeTelemetryByAuthenticatedUserSucceeds() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/sensor-telemetry");
        accessor.setUser(new UsernamePasswordAuthenticationToken(athleteUser, null, athleteUser.getAuthorities()));
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, messageChannel);
        assertNotNull(result);
    }
}
