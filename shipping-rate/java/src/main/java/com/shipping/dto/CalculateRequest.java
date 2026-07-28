package com.shipping.dto;

import lombok.Data;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
public class CalculateRequest {

    @NotBlank(message = "服务类型不能为空")
    private String service;

    @NotBlank(message = "物品类型不能为空")
    private String type;

    @NotNull(message = "重量不能为空")
    @DecimalMin(value = "0.1", message = "重量必须大于0")
    private BigDecimal weight;

    @NotBlank(message = "目的地不能为空")
    private String destination;
}
