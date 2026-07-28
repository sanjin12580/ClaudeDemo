package com.shipping.controller;

import com.shipping.dto.CalculateRequest;
import com.shipping.dto.CalculateResponse;
import com.shipping.entity.Destination;
import com.shipping.entity.ServiceType;
import com.shipping.service.ShippingService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shipping")
public class ShippingController {

    @Resource
    private ShippingService shippingService;

    /**
     * 计算快递费用
     *
     * POST /api/shipping/calculate
     * {
     *   "service": "express_saver",
     *   "type": "document",
     *   "weight": 5.5,
     *   "destination": "美国"
     * }
     */
    @PostMapping("/calculate")
    public ResponseEntity<?> calculate(@Validated @RequestBody CalculateRequest request) {
        try {
            CalculateResponse response = shippingService.calculate(request);
            return ResponseEntity.ok(success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    /**
     * 获取服务类型列表
     *
     * GET /api/shipping/services
     */
    @GetMapping("/services")
    public ResponseEntity<?> getServices() {
        List<ServiceType> services = shippingService.getServices();
        return ResponseEntity.ok(success(services));
    }

    /**
     * 获取目的地列表
     *
     * GET /api/shipping/destinations
     */
    @GetMapping("/destinations")
    public ResponseEntity<?> getDestinations() {
        List<Destination> destinations = shippingService.getDestinations();
        return ResponseEntity.ok(success(destinations));
    }

    private Map<String, Object> success(Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", data);
        return result;
    }

    private Map<String, Object> error(String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 400);
        result.put("message", message);
        result.put("data", null);
        return result;
    }
}
