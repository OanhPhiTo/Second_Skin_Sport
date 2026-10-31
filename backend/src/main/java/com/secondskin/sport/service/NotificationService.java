package com.secondskin.sport.service;

import com.secondskin.sport.dto.NotificationDTO;
import com.secondskin.sport.entity.SportSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.stream.Collectors;

@Slf4j
@Service
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    // Store in-memory bounded notifications per user (max 50 notifications each)
    private final Map<Long, Deque<NotificationDTO>> userNotifications = new ConcurrentHashMap<>();
    private static final int MAX_NOTIFICATIONS_PER_USER = 50;

    public NotificationService(@Autowired(required = false) SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Tự động sinh và phát thông báo khi kết thúc một phiên tập thể thao.
     */
    public NotificationDTO sendSessionCompletedNotification(SportSession session) {
        if (session == null) {
            return null;
        }

        Long userId = session.getUserId() != null ? session.getUserId() : 1L;
        String sportName = session.getSport() != null ? session.getSport() : "Vận động";
        int duration = session.getDurationMinutes() > 0 ? session.getDurationMinutes() : 1;
        int score = session.getPerformanceScore() > 0 ? session.getPerformanceScore() : 85;
        int jumps = session.getTotalJumps() > 0 ? session.getTotalJumps() : 0;
        double accel = session.getAverageAcceleration() > 0 ? session.getAverageAcceleration() : 2.5;

        String sportLabel = switch (sportName.toLowerCase()) {
            case "basketball" -> "Bóng rổ";
            case "running" -> "Chạy bộ";
            case "football", "soccer" -> "Bóng đá";
            default -> sportName;
        };

        String title = "Hoàn thành phiên tập " + sportLabel + "!";
        String message = String.format("Bạn đã hoàn thành buổi tập %s (%d phút). Điểm hiệu suất: %d/100, %d lần nhảy.",
                sportLabel, duration, score, jumps);

        NotificationDTO notification = NotificationDTO.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .title(title)
                .message(message)
                .type("SESSION_COMPLETED")
                .sessionId(session.getId())
                .sport(sportName)
                .durationMinutes(duration)
                .performanceScore(score)
                .totalJumps(jumps)
                .averageAcceleration(accel)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();

        // 1. Lưu vào danh sách thông báo của người dùng
        saveNotification(userId, notification);

        // 2. Phát thông báo thời gian thực qua WebSocket STOMP
        pushNotificationOverWebSocket(notification);

        log.info("[NotificationService] Đã tạo & gửi thông báo kết thúc phiên tập ID: {} cho user ID: {}",
                session.getId(), userId);

        return notification;
    }

    private void saveNotification(Long userId, NotificationDTO notification) {
        Deque<NotificationDTO> deque = userNotifications.computeIfAbsent(userId, k -> new ConcurrentLinkedDeque<>());
        deque.addFirst(notification);
        while (deque.size() > MAX_NOTIFICATIONS_PER_USER) {
            deque.removeLast();
        }
    }

    private void pushNotificationOverWebSocket(NotificationDTO notification) {
        if (messagingTemplate != null) {
            try {
                // Broadcast chung cho các subscriber lắng nghe kênh thông báo
                messagingTemplate.convertAndSend("/topic/notifications", notification);

                // Gửi riêng cho topic của từng người dùng
                if (notification.getUserId() != null) {
                    messagingTemplate.convertAndSend("/topic/notifications/" + notification.getUserId(), notification);
                }
            } catch (Exception ex) {
                log.warn("[NotificationService] Không thể phát WebSocket STOMP: {}", ex.getMessage());
            }
        }
    }

    public List<NotificationDTO> getNotifications(Long userId) {
        if (userId == null) {
            return Collections.emptyList();
        }
        Deque<NotificationDTO> deque = userNotifications.get(userId);
        if (deque == null || deque.isEmpty()) {
            return Collections.emptyList();
        }
        return new ArrayList<>(deque);
    }

    public boolean markAsRead(String notificationId, Long userId) {
        if (notificationId == null || userId == null) return false;
        Deque<NotificationDTO> deque = userNotifications.get(userId);
        if (deque == null) return false;

        for (NotificationDTO dto : deque) {
            if (notificationId.equals(dto.getId())) {
                dto.setRead(true);
                return true;
            }
        }
        return false;
    }

    public void markAllAsRead(Long userId) {
        if (userId == null) return;
        Deque<NotificationDTO> deque = userNotifications.get(userId);
        if (deque != null) {
            for (NotificationDTO dto : deque) {
                dto.setRead(true);
            }
        }
    }

    public void clearAll(Long userId) {
        if (userId == null) return;
        Deque<NotificationDTO> deque = userNotifications.get(userId);
        if (deque != null) {
            deque.clear();
        }
    }
}

