package com.secondskin.sport.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {
    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        // A request carrying an invalid credential is forbidden from continuing;
        // a request with no credential is an authentication challenge (401).
        boolean suppliedCredential = request.getHeader("Authorization") != null;
        response.setStatus(suppliedCredential ? HttpServletResponse.SC_FORBIDDEN : HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now());
        int status = response.getStatus();
        body.put("status", status);
        body.put("error", status == 403 ? "Forbidden" : "Unauthorized");
        body.put("message", status == 403 ? "Thông tin xác thực không hợp lệ hoặc không đủ quyền." : "Yêu cầu xác thực hợp lệ.");
        body.put("path", request.getRequestURI());
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
