package com.shipping.mapper;

import com.shipping.entity.ServiceType;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface ServiceTypeMapper {

    List<ServiceType> findAll();

    ServiceType findByCode(@Param("code") String code);
}
