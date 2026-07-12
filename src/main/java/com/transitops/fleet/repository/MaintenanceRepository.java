package com.transitops.fleet.repository;

import com.transitops.fleet.model.MaintenanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceRepository extends JpaRepository<MaintenanceRecord, Long> {
    List<MaintenanceRecord> findByVehicleIgnoreCase(String vehicle);
    boolean existsByVehicleIgnoreCaseAndStatus(String vehicle, String status);
}
