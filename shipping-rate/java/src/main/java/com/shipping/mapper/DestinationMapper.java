package com.shipping.mapper;

import com.shipping.entity.Destination;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface DestinationMapper {

    List<Destination> findAll();

    Destination findByName(@Param("name") String name);
}
