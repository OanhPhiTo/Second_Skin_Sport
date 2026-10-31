package com.secondskin.sport.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.DeviceDTO;
import com.secondskin.sport.dto.SensorDataDTO;
import com.secondskin.sport.dto.SensorStatusDTO;
import com.secondskin.sport.security.CustomUserDetailsService;
import com.secondskin.sport.security.JwtService;
import com.secondskin.sport.service.DeviceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    value = DeviceController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        UserDetailsServiceAutoConfiguration.class
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class DeviceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DeviceService deviceService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("GET /api/devices returns List of DeviceDTO")
    void testGetAllDevices_ReturnsDeviceDTOList() throws Exception {
        DeviceDTO dto = DeviceDTO.builder()
                .id(1L)
                .name("Foot Patch Left")
                .deviceName("Foot Patch Left")
                .deviceCode("DEV-P01")
                .deviceId("DEV-P01")
                .status("CONNECTED")
                .connected(true)
                .batteryLevel(92)
                .type("BLE")
                .connectionType("BLE")
                .build();

        Mockito.when(deviceService.getAllDevices()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].name").value("Foot Patch Left"))
                .andExpect(jsonPath("$[0].deviceName").value("Foot Patch Left"))
                .andExpect(jsonPath("$[0].deviceCode").value("DEV-P01"))
                .andExpect(jsonPath("$[0].deviceId").value("DEV-P01"))
                .andExpect(jsonPath("$[0].status").value("CONNECTED"))
                .andExpect(jsonPath("$[0].connected").value(true));
    }

    @Test
    @DisplayName("GET /api/devices/{id} returns DeviceDTO when found")
    void testGetDeviceById_Found_ReturnsDeviceDTO() throws Exception {
        DeviceDTO dto = DeviceDTO.builder()
                .id(1L)
                .name("Waist Sensor")
                .deviceName("Waist Sensor")
                .deviceCode("DEV-W01")
                .deviceId("DEV-W01")
                .status("CONNECTED")
                .connected(true)
                .batteryLevel(96)
                .build();

        Mockito.when(deviceService.getDeviceById(1L)).thenReturn(Optional.of(dto));

        mockMvc.perform(get("/api/devices/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.deviceName").value("Waist Sensor"))
                .andExpect(jsonPath("$.batteryLevel").value(96));
    }

    @Test
    @DisplayName("GET /api/devices/{id} returns 404 when not found")
    void testGetDeviceById_NotFound_Returns404() throws Exception {
        Mockito.when(deviceService.getDeviceById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/devices/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/devices/status returns SensorStatusDTO with encapsulated SensorDataDTO")
    void testGetSensorStatus_ReturnsSensorStatusDTO_EncapsulatingSensorDataDTO() throws Exception {
        SensorDataDTO dataDTO = SensorDataDTO.builder()
                .id(5L)
                .ax(0.1)
                .ay(0.2)
                .az(9.81)
                .accelerometerX(0.1)
                .accelerometerY(0.2)
                .accelerometerZ(9.81)
                .build();

        SensorStatusDTO statusDTO = SensorStatusDTO.builder()
                .deviceId("DEV-STATUS-01")
                .deviceName("Primary Patch")
                .connected(true)
                .batteryLevel(85)
                .lastSync("Vừa xong")
                .currentData(dataDTO)
                .build();

        Mockito.when(deviceService.getSensorStatus()).thenReturn(statusDTO);

        mockMvc.perform(get("/api/devices/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deviceId").value("DEV-STATUS-01"))
                .andExpect(jsonPath("$.currentData.ax").value(0.1))
                .andExpect(jsonPath("$.currentData.accelerometerX").value(0.1));
    }

    @Test
    @DisplayName("POST /api/devices/{id}/connect toggles connection state")
    void testConnectDevice_Success() throws Exception {
        DeviceDTO dto = DeviceDTO.builder().id(1L).connected(true).status("CONNECTED").build();
        Mockito.when(deviceService.updateConnectionStatus(1L, true)).thenReturn(dto);

        mockMvc.perform(post("/api/devices/1/connect"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.connected").value(true));
    }

    @Test
    @DisplayName("POST /api/devices/{id}/disconnect toggles connection state")
    void testDisconnectDevice_Success() throws Exception {
        DeviceDTO dto = DeviceDTO.builder().id(1L).connected(false).status("DISCONNECTED").build();
        Mockito.when(deviceService.updateConnectionStatus(1L, false)).thenReturn(dto);

        mockMvc.perform(post("/api/devices/1/disconnect"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.connected").value(false));
    }

    @Test
    @DisplayName("POST /api/devices/{id}/sync syncs device and returns response")
    void testSyncDevice_Success() throws Exception {
        DeviceDTO dto = DeviceDTO.builder().id(1L).deviceId("DEV-01").lastSyncTime(LocalDateTime.now()).build();
        Mockito.when(deviceService.syncDevice(1L)).thenReturn(dto);

        mockMvc.perform(post("/api/devices/1/sync"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.deviceId").value("DEV-01"));
    }

    @Test
    @DisplayName("PUT /api/devices/{id}/battery updates battery level")
    void testUpdateBattery_Success() throws Exception {
        DeviceDTO dto = DeviceDTO.builder().id(1L).deviceId("DEV-01").batteryLevel(78).build();
        Mockito.when(deviceService.updateBatteryLevel(1L, 78)).thenReturn(dto);

        mockMvc.perform(put("/api/devices/1/battery")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("batteryLevel", 78))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.batteryLevel").value(78));
    }

    @Test
    @DisplayName("PUT /api/devices/{id}/battery with null batteryLevel defaults safely to 100")
    void testUpdateBattery_NullBatteryLevel_DefaultsTo100() throws Exception {
        DeviceDTO dto = DeviceDTO.builder().id(1L).deviceId("DEV-01").batteryLevel(100).build();
        Mockito.when(deviceService.updateBatteryLevel(1L, 100)).thenReturn(dto);

        mockMvc.perform(put("/api/devices/1/battery")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"batteryLevel\": null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.batteryLevel").value(100));
    }

    @Test
    @DisplayName("PUT /api/devices/{id}/battery with empty payload defaults safely to 100")
    void testUpdateBattery_EmptyPayload_DefaultsTo100() throws Exception {
        DeviceDTO dto = DeviceDTO.builder().id(1L).deviceId("DEV-01").batteryLevel(100).build();
        Mockito.when(deviceService.updateBatteryLevel(1L, 100)).thenReturn(dto);

        mockMvc.perform(put("/api/devices/1/battery")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.batteryLevel").value(100));
    }
}
