package com.secondskin.sport.controller;

import com.secondskin.sport.dto.UserDTO;
import com.secondskin.sport.service.AdminService;
import lombok.RequiredArgsConstructor;
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
}
