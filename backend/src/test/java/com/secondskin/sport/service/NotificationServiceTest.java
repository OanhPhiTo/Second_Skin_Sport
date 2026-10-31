package com.secondskin.sport.service;

import com.secondskin.sport.dto.NotificationDTO;
import com.secondskin.sport.entity.SportSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("NotificationService - Unit Tests")
class NotificationServiceTest {

    private NotificationService notificationService;
    private final List<String> sentDestinations = new ArrayList<>();
    private final List<Object> sentPayloads = new ArrayList<>();

    @BeforeEach
    void setUp() {
        sentDestinations.clear();
        sentPayloads.clear();

        // Native mock cho SimpMessagingTemplate bằng subclass anonymous
        notificationService = new NotificationService(null) {
            // Test with null messagingTemplate first, or override push
        };
    }

    @Test
    void testSendSessionCompletedNotification_WithValidSession() {
        SportSession session = new SportSession(
                2L, "ESP32-DEVICE", "Basketball",
                LocalDateTime.now().minusMinutes(45), LocalDateTime.now(), 45,
                24, 60, 3.2, 19.5, 88, 92, "Completed"
        );
        session.setId(101L);

        NotificationDTO notification = notificationService.sendSessionCompletedNotification(session);

        assertNotNull(notification);
        assertEquals(2L, notification.getUserId());
        assertEquals("SESSION_COMPLETED", notification.getType());
        assertEquals(101L, notification.getSessionId());
        assertEquals("Basketball", notification.getSport());
        assertEquals(45, notification.getDurationMinutes());
        assertEquals(92, notification.getPerformanceScore());
        assertEquals(24, notification.getTotalJumps());
        assertFalse(notification.isRead());
        assertTrue(notification.getTitle().contains("Bóng rổ"));
        assertTrue(notification.getMessage().contains("92/100"));

        // Kiểm tra danh sách notifications của user 2L
        List<NotificationDTO> userList = notificationService.getNotifications(2L);
        assertEquals(1, userList.size());
        assertEquals(notification.getId(), userList.get(0).getId());
    }

    @Test
    void testMarkAsReadAndMarkAllAsRead() {
        SportSession session1 = new SportSession(3L, "DEV", "Running", LocalDateTime.now(), LocalDateTime.now(), 30, 0, 10, 2.0, 12.0, 60, 75, "Completed");
        session1.setId(201L);
        SportSession session2 = new SportSession(3L, "DEV", "Running", LocalDateTime.now(), LocalDateTime.now(), 20, 0, 5, 2.1, 11.5, 55, 70, "Completed");
        session2.setId(202L);

        NotificationDTO n1 = notificationService.sendSessionCompletedNotification(session1);
        NotificationDTO n2 = notificationService.sendSessionCompletedNotification(session2);

        // Mark n1 as read
        boolean marked = notificationService.markAsRead(n1.getId(), 3L);
        assertTrue(marked);

        List<NotificationDTO> list = notificationService.getNotifications(3L);
        assertTrue(list.stream().filter(n -> n.getId().equals(n1.getId())).findFirst().get().isRead());
        assertFalse(list.stream().filter(n -> n.getId().equals(n2.getId())).findFirst().get().isRead());

        // Mark all as read
        notificationService.markAllAsRead(3L);
        list = notificationService.getNotifications(3L);
        assertTrue(list.stream().allMatch(NotificationDTO::isRead));
    }

    @Test
    void testClearAll() {
        SportSession session = new SportSession(4L, "DEV", "Running", LocalDateTime.now(), LocalDateTime.now(), 25, 0, 8, 2.2, 13.0, 65, 80, "Completed");
        session.setId(301L);

        notificationService.sendSessionCompletedNotification(session);
        assertEquals(1, notificationService.getNotifications(4L).size());

        notificationService.clearAll(4L);
        assertEquals(0, notificationService.getNotifications(4L).size());
    }
}

