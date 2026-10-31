package com.secondskin.sport.config;

import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminSeeder {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    @Value("${admin.default-email:${ADMIN_DEFAULT_EMAIL:admin@secondskin.com}}")
    private String adminEmail;

    @Value("${admin.default-password:${ADMIN_DEFAULT_PASSWORD:admin123}}")
    private String adminPassword;

    @Bean
    CommandLineRunner initAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.existsByEmail(adminEmail)) {
                User admin = new User(
                        "System Administrator",
                        adminEmail,
                        passwordEncoder.encode(adminPassword),
                        Role.ADMIN,
                        "All"
                );
                userRepository.save(admin);
                log.info("Default Admin account seeded successfully for email: {}", adminEmail);
            }
        };
    }
}
