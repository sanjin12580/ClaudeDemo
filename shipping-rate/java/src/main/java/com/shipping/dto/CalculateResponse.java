package com.shipping.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class CalculateResponse {

    private BigDecimal price;
    private String currency;
    private String serviceName;
    private String itemType;
    private BigDecimal weight;
    private String destination;
}
