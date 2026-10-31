package com.secondskin.sport.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.CreateCoachRequestDTO;
import com.secondskin.sport.dto.UserDTO;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.service.AdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("AdminController - REST Endpoints Tests (Standalone Setup)")
public class AdminControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private List<UserDTO> userList;
    private boolean throwDuplicateEmail;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        userList = new ArrayList<>();
        throwDuplicateEmail = false;

        // Subclass stub of AdminService avoiding heavy reflection dynamic agents
        AdminService stubAdminService = new AdminService(null, null) {
            @Override
            public List<UserDTO> getAllUsers() {
                return userList;
            }

            @Override
            public UserDTO createCoach(CreateCoachRequestDTO req) {
                if (throwDuplicateEmail) {
                    throw new IllegalArgumentException("Email '" + req.getEmail() + "' đã tồn tại trên hệ thống.");
                }
                return UserDTO.builder()
                        .id(10L)
                        .name(req.getName())
                        .email(req.getEmail())
                        .role(Role.COACH)
                        .preferredSport(req.getPreferredSport())
                        .createdAt(LocalDateTime.now())
                        .enabled(true)
                        .build();
            }

            @Override
            public void banUser(Long id) {}

            @Override
            public void unbanUser(Long id) {}

            @Override
            public void updateUserRole(Long id, Role role) {}

            @Override
            public void deleteUser(Long id) {}
        };

        AdminController controller = new AdminController(stubAdminService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/admin/users returns user list")
    void testGetAllUsers() throws Exception {
        userList.add(UserDTO.builder()
                .id(1L)
                .name("Admin User")
                .email("admin@secondskin.com")
                .role(Role.ADMIN)
                .preferredSport("All")
                .createdAt(LocalDateTime.now())
                .enabled(true)
                .build());

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("admin@secondskin.com"))
                .andExpect(jsonPath("$[0].role").value("ADMIN"));
    }

    @Test
    @DisplayName("POST /api/admin/coaches creates coach successfully with 201 Created")
    void testCreateCoach() throws Exception {
        CreateCoachRequestDTO req = CreateCoachRequestDTO.builder()
                .name("Coach John")
                .email("coach.john@secondskin.io")
                .password("password123")
                .preferredSport("Basketball")
                .build();

        mockMvc.perform(post("/api/admin/coaches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(jsonPath("$.role").value("COACH"))
                .andExpect(jsonPath("$.email").value("coach.john@secondskin.io"))
                .andExpect(jsonPath("$.name").value("Coach John"));
    }

    @Test
    @DisplayName("POST /api/admin/coaches returns 400 Bad Request on duplicate email")
    void testCreateCoachDuplicateEmail_ReturnsBadRequest() throws Exception {
        throwDuplicateEmail = true;

        CreateCoachRequestDTO req = CreateCoachRequestDTO.builder()
                .name("Coach Duplicate")
                .email("dup@secondskin.io")
                .build();

        mockMvc.perform(post("/api/admin/coaches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email 'dup@secondskin.io' đã tồn tại trên hệ thống."));
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id}/ban returns 200 OK")
    void testBanUser() throws Exception {
        mockMvc.perform(put("/api/admin/users/1/ban"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/admin/users/{id} returns 200 OK")
    void testDeleteUser() throws Exception {
        mockMvc.perform(delete("/api/admin/users/1"))
                .andExpect(status().isOk());
    }
}
