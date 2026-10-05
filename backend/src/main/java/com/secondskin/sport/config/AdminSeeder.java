package com.secondskin.sport.config;

import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminSeeder {

    @Bean
    CommandLineRunner initAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.existsByEmail("admin@secondskin.com")) {
                User admin = new User(
                        "System Administrator",
                        "admin@secondskin.com",
                        passwordEncoder.encode("admin123"),
                        Role.ADMIN,
                        "All"
                );
                userRepository.save(admin);
                System.out.println("Default Admin account created (admin@secondskin.com / admin123)");
            }
        };
    }
}
