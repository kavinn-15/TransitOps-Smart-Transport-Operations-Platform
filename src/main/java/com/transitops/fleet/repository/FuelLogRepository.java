package com.transitops.fleet.repository;

import com.transitops.fleet.model.FuelLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FuelLogRepository extends JpaRepository<FuelLog, Long> {
    List<FuelLog> findByVehicleIgnoreCase(String vehicle);
}
