package com.secondskin.sport.service;

import com.secondskin.sport.dto.CreateCoachRequestDTO;
import com.secondskin.sport.dto.UserDTO;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public UserDTO createCoach(CreateCoachRequestDTO req) {
        if (req == null || req.getEmail() == null || req.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email không được để trống.");
        }
        String email = req.getEmail().trim();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email '" + email + "' đã tồn tại trên hệ thống.");
        }
        String rawPassword = (req.getPassword() != null && !req.getPassword().trim().isEmpty())
                ? req.getPassword().trim()
                : "Coach@123456";
        String name = (req.getName() != null && !req.getName().trim().isEmpty())
                ? req.getName().trim()
                : "Huấn luyện viên";
        String sport = (req.getPreferredSport() != null && !req.getPreferredSport().trim().isEmpty())
                ? req.getPreferredSport().trim()
                : "Basketball";

        User coach = new User(
                name,
                email,
                passwordEncoder.encode(rawPassword),
                Role.COACH,
                sport
        );
        User saved = userRepository.save(coach);
        return mapToDTO(saved);
    }

    public void banUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại"));
        user.setEnabled(false);
        userRepository.save(user);
    }

    public void unbanUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại"));
        user.setEnabled(true);
        userRepository.save(user);
    }

    public void updateUserRole(Long userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại"));
        user.setRole(role);
        userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .preferredSport(user.getPreferredSport())
                .createdAt(user.getCreatedAt())
                .enabled(user.isEnabled())
                .build();
    }
}
