package com.shipping.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ShippingRate {

    private Long id;
    private Integer serviceTypeId;
    private Integer itemType;
    private String pricingMode;       // FIXED / PER_KG
    private BigDecimal weightMin;
    private BigDecimal weightMax;     // PER_KG模式下 99999=无上限
    private BigDecimal price;         // FIXED: 票价, PER_KG: 单价/kg
    private Integer destinationId;
    private LocalDateTime createdAt;
}
