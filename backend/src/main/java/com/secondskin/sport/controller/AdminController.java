package com.secondskin.sport.controller;

import com.secondskin.sport.dto.CreateCoachRequestDTO;
import com.secondskin.sport.dto.UserDTO;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PostMapping("/coaches")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> createCoach(@RequestBody CreateCoachRequestDTO req) {
        UserDTO coach = adminService.createCoach(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(coach);
    }

    @PutMapping("/users/{id}/ban")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> banUser(@PathVariable Long id) {
        adminService.banUser(id);
        return ResponseEntity.ok("Tài khoản đã bị khóa thành công.");
    }

    @PutMapping("/users/{id}/unban")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> unbanUser(@PathVariable Long id) {
        adminService.unbanUser(id);
        return ResponseEntity.ok("Tài khoản đã được mở khóa.");
    }

    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> updateUserRole(@PathVariable Long id, @RequestParam Role role) {
        adminService.updateUserRole(id, role);
        return ResponseEntity.ok("Cập nhật quyền thành công.");
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok("Đã xóa người dùng khỏi hệ thống.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<java.util.Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", ex.getMessage()));
    }
}
