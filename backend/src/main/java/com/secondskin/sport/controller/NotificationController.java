package com.secondskin.sport.controller;

import com.secondskin.sport.dto.NotificationDTO;
import com.secondskin.sport.security.SecurityUtils;
import com.secondskin.sport.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    private Long resolveUserId() {
        return SecurityUtils.getCurrentUser()
                .map(u -> u.getId())
                .orElse(1L);
    }

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getNotifications() {
        Long userId = resolveUserId();
        return ResponseEntity.ok(notificationService.getNotifications(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable String id) {
        Long userId = resolveUserId();
        boolean success = notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(Map.of("success", success));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead() {
        Long userId = resolveUserId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> clearAll() {
        Long userId = resolveUserId();
        notificationService.clearAll(userId);
        return ResponseEntity.ok(Map.of("success", true));
    }
}

