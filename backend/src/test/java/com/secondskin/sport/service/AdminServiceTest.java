package com.secondskin.sport.service;

import com.secondskin.sport.dto.CreateCoachRequestDTO;
import com.secondskin.sport.dto.UserDTO;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Proxy;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("AdminService - Pure Business Logic Unit Tests")
public class AdminServiceTest {

    private final Map<Long, User> userDatabase = new HashMap<>();
    private final AtomicLong idSequence = new AtomicLong(100L);
    private final List<String> encodedPasswords = new ArrayList<>();

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AdminService adminService;

    @BeforeEach
    void setUp() {
        userDatabase.clear();
        encodedPasswords.clear();

        // Standard Dynamic Proxy for UserRepository - JVM native, zero ByteBuddy dynamic agent dependency
        userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("existsByEmail".equals(methodName)) {
                        String email = (String) args[0];
                        return userDatabase.values().stream()
                                .anyMatch(u -> email.equalsIgnoreCase(u.getEmail()));
                    }
                    if ("save".equals(methodName)) {
                        User u = (User) args[0];
                        if (u.getId() == null) {
                            u.setId(idSequence.incrementAndGet());
                        }
                        userDatabase.put(u.getId(), u);
                        return u;
                    }
                    if ("findById".equals(methodName)) {
                        Long id = (Long) args[0];
                        return Optional.ofNullable(userDatabase.get(id));
                    }
                    if ("findAll".equals(methodName)) {
                        return new ArrayList<>(userDatabase.values());
                    }
                    if ("deleteById".equals(methodName)) {
                        Long id = (Long) args[0];
                        userDatabase.remove(id);
                        return null;
                    }
                    return null;
                }
        );

        // Standard Dynamic Proxy for PasswordEncoder
        passwordEncoder = (PasswordEncoder) Proxy.newProxyInstance(
                PasswordEncoder.class.getClassLoader(),
                new Class<?>[]{PasswordEncoder.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("encode".equals(methodName)) {
                        String raw = String.valueOf(args[0]);
                        encodedPasswords.add(raw);
                        return "BCrypt[" + raw + "]";
                    }
                    if ("matches".equals(methodName)) {
                        String raw = String.valueOf(args[0]);
                        String encoded = String.valueOf(args[1]);
                        return ("BCrypt[" + raw + "]").equals(encoded);
                    }
                    return null;
                }
        );

        adminService = new AdminService(userRepository, passwordEncoder);
    }

    @Test
    @DisplayName("getAllUsers returns all persisted users as DTOs")
    void testGetAllUsers() {
        User u1 = new User("Admin", "admin@secondskin.com", "pass1", Role.ADMIN, "All");
        User u2 = new User("Coach Mike", "mike@secondskin.io", "pass2", Role.COACH, "Basketball");
        userRepository.save(u1);
        userRepository.save(u2);

        List<UserDTO> all = adminService.getAllUsers();
        assertEquals(2, all.size());
        assertTrue(all.stream().anyMatch(dto -> dto.getEmail().equals("admin@secondskin.com")));
        assertTrue(all.stream().anyMatch(dto -> dto.getEmail().equals("mike@secondskin.io")));
    }

    @Test
    @DisplayName("createCoach creates new coach with role COACH and encoded password")
    void testCreateCoachSuccess() {
        CreateCoachRequestDTO req = CreateCoachRequestDTO.builder()
                .name("Coach Mike")
                .email("mike.new@secondskin.io")
                .password("securePass123")
                .preferredSport("Basketball")
                .build();

        UserDTO result = adminService.createCoach(req);

        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals("Coach Mike", result.getName());
        assertEquals("mike.new@secondskin.io", result.getEmail());
        assertEquals(Role.COACH, result.getRole());
        assertEquals("Basketball", result.getPreferredSport());
        assertTrue(result.isEnabled());

        // Verify password was securely encoded
        assertTrue(encodedPasswords.contains("securePass123"));
        User inDb = userDatabase.get(result.getId());
        assertNotNull(inDb);
        assertEquals("BCrypt[securePass123]", inDb.getPassword());
        assertEquals(Role.COACH, inDb.getRole());
    }

    @Test
    @DisplayName("createCoach throws IllegalArgumentException if email already exists")
    void testCreateCoachDuplicateEmail() {
        User existing = new User("Existing", "existing@secondskin.io", "pass", Role.COACH, "Basketball");
        userRepository.save(existing);

        CreateCoachRequestDTO req = CreateCoachRequestDTO.builder()
                .name("Coach Duplicate")
                .email("existing@secondskin.io")
                .password("pass123")
                .preferredSport("Running")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> adminService.createCoach(req));
        assertTrue(ex.getMessage().contains("existing@secondskin.io"));
    }

    @Test
    @DisplayName("createCoach throws IllegalArgumentException if email is null or blank")
    void testCreateCoachBlankEmail() {
        CreateCoachRequestDTO reqNull = CreateCoachRequestDTO.builder().email(null).build();
        assertThrows(IllegalArgumentException.class, () -> adminService.createCoach(reqNull));

        CreateCoachRequestDTO reqBlank = CreateCoachRequestDTO.builder().email("   ").build();
        assertThrows(IllegalArgumentException.class, () -> adminService.createCoach(reqBlank));
    }

    @Test
    @DisplayName("createCoach applies default password and name if blank")
    void testCreateCoachDefaultValues() {
        CreateCoachRequestDTO req = CreateCoachRequestDTO.builder()
                .email("new.coach@secondskin.io")
                .password("")
                .name("")
                .preferredSport("")
                .build();

        UserDTO result = adminService.createCoach(req);

        assertEquals("Huấn luyện viên", result.getName());
        assertEquals("Basketball", result.getPreferredSport());
        assertEquals(Role.COACH, result.getRole());
        assertTrue(encodedPasswords.contains("Coach@123456"));
    }

    @Test
    @DisplayName("banUser and unbanUser toggle user enabled state")
    void testBanAndUnbanUser() {
        User user = new User("Alex", "alex@secondskin.io", "pass", Role.USER, "Basketball");
        User saved = userRepository.save(user);

        adminService.banUser(saved.getId());
        assertFalse(userDatabase.get(saved.getId()).isEnabled());

        adminService.unbanUser(saved.getId());
        assertTrue(userDatabase.get(saved.getId()).isEnabled());
    }

    @Test
    @DisplayName("updateUserRole changes role successfully")
    void testUpdateUserRole() {
        User user = new User("Athlete", "athlete@secondskin.io", "pass", Role.USER, "Running");
        User saved = userRepository.save(user);

        adminService.updateUserRole(saved.getId(), Role.COACH);
        assertEquals(Role.COACH, userDatabase.get(saved.getId()).getRole());
    }

    @Test
    @DisplayName("deleteUser removes user from database")
    void testDeleteUser() {
        User user = new User("Temporary", "temp@secondskin.io", "pass", Role.USER, "Running");
        User saved = userRepository.save(user);
        Long id = saved.getId();

        assertTrue(userDatabase.containsKey(id));
        adminService.deleteUser(id);
        assertFalse(userDatabase.containsKey(id));
    }
}
