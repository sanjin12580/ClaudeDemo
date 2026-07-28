package com.shipping.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ServiceType {

    private Integer id;
    private String code;
    private String nameCn;
    private String nameEn;
    private LocalDateTime createdAt;
}
