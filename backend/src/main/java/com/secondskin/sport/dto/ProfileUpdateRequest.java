package com.secondskin.sport.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfileUpdateRequest {
    @NotBlank(message = "Họ tên không được để trống.")
    @Size(max = 120, message = "Họ tên không được vượt quá 120 ký tự.")
    private String name;

    @NotBlank(message = "Môn thể thao không được để trống.")
    private String preferredSport;
}
