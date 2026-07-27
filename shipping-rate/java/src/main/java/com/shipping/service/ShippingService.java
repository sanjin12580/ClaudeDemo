package com.shipping.service;

import com.shipping.dto.CalculateRequest;
import com.shipping.dto.CalculateResponse;
import com.shipping.entity.Destination;
import com.shipping.entity.ServiceType;
import com.shipping.entity.ShippingRate;
import com.shipping.mapper.DestinationMapper;
import com.shipping.mapper.ServiceTypeMapper;
import com.shipping.mapper.ShippingRateMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ShippingService {

    private static final Map<String, Integer> ITEM_TYPE_MAP = new HashMap<>();
    static {
        ITEM_TYPE_MAP.put("document", 0);
        ITEM_TYPE_MAP.put("non_document", 1);
    }

    @Resource
    private ServiceTypeMapper serviceTypeMapper;

    @Resource
    private DestinationMapper destinationMapper;

    @Resource
    private ShippingRateMapper shippingRateMapper;

    /**
     * 计算快递费用（阶梯累加计价）
     *
     * 计价规则:
     * - 0-20kg: FIXED 模式，直接取票价
     * - 21kg+:  PER_KG 模式，每段 = (min(weight, tier_max) - tier_min + 1) × 单价
     * - 总价 = FIXED票价 + 各PER_KG段费用之和
     */
    public CalculateResponse calculate(CalculateRequest request) {
        // 1. 查询服务类型
        ServiceType serviceType = serviceTypeMapper.findByCode(request.getService());
        if (serviceType == null) {
            throw new IllegalArgumentException("不支持的服务类型: " + request.getService());
        }

        // 2. 解析物品类型
        Integer itemType = ITEM_TYPE_MAP.get(request.getType());
        if (itemType == null) {
            throw new IllegalArgumentException("不支持的物品类型: " + request.getType() + "，可选: document, non_document");
        }

        // 3. 查询目的地
        Destination destination = destinationMapper.findByName(request.getDestination());
        if (destination == null) {
            throw new IllegalArgumentException("不支持的目的地: " + request.getDestination());
        }

        // 4. 查询所有适用的费率阶梯
        List<ShippingRate> tiers = shippingRateMapper.findTiersByCondition(
                serviceType.getId(), itemType, destination.getId(), request.getWeight());

        if (tiers.isEmpty()) {
            throw new IllegalArgumentException(
                    String.format("未找到匹配的费率: 服务=%s, 类型=%s, 重量=%skg, 目的地=%s",
                            request.getService(), request.getType(), request.getWeight(), request.getDestination()));
        }

        // 5. 阶梯累加计算
        BigDecimal totalPrice = BigDecimal.ZERO;
        BigDecimal fixedPrice = null;
        BigDecimal weight = request.getWeight();

        for (ShippingRate tier : tiers) {
            if ("FIXED".equals(tier.getPricingMode())) {
                // FIXED: 固定票价，取 weightMin <= weight 的最高阶梯（最后一个匹配的）
                if (weight.compareTo(tier.getWeightMin()) >= 0) {
                    fixedPrice = tier.getPrice();
                }
            } else if ("PER_KG".equals(tier.getPricingMode())) {
                // PER_KG: 阶梯累加
                // 该段重量 = min(weight, tier.weightMax) - tier.weightMin + 1
                if (weight.compareTo(tier.getWeightMin()) >= 0) {
                    BigDecimal segmentMax = tier.getWeightMax().compareTo(weight) < 0
                            ? tier.getWeightMax() : weight;
                    BigDecimal segmentKg = segmentMax.subtract(tier.getWeightMin()).add(BigDecimal.ONE);
                    BigDecimal segmentCost = segmentKg.multiply(tier.getPrice());
                    totalPrice = totalPrice.add(segmentCost);

                }
            }
        }

        // 加上固定票价
        if (fixedPrice != null) {
            totalPrice = totalPrice.add(fixedPrice);
        }

        return CalculateResponse.builder()
                .price(totalPrice.setScale(2, RoundingMode.HALF_UP))
                .currency("CNY")
                .serviceName(serviceType.getNameCn())
                .itemType(itemType == 0 ? "文件" : "非文件")
                .weight(weight)
                .destination(destination.getName())
                .build();
    }

    /**
     * 获取所有服务类型
     */
    public List<ServiceType> getServices() {
        return serviceTypeMapper.findAll();
    }

    /**
     * 获取所有目的地
     */
    public List<Destination> getDestinations() {
        return destinationMapper.findAll();
    }
}
