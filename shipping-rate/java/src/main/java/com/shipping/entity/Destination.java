package com.shipping.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Destination {

    private Integer id;
    private String name;
    private Integer sortOrder;
    private LocalDateTime createdAt;
}
