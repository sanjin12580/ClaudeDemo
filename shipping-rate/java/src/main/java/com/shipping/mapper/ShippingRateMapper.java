package com.shipping.mapper;

import com.shipping.entity.ShippingRate;
import org.apache.ibatis.annotations.Param;
import java.math.BigDecimal;
import java.util.List;

public interface ShippingRateMapper {

    /**
     * 查询所有适用的费率阶梯（weight_min < weight 的所有行）
     * 包括 FIXED 固定价和 PER_KG 阶梯价
     */
    List<ShippingRate> findTiersByCondition(@Param("serviceTypeId") Integer serviceTypeId,
                                             @Param("itemType") Integer itemType,
                                             @Param("destinationId") Integer destinationId,
                                             @Param("weight") BigDecimal weight);
}
