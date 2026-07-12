package com.transitops.fleet.repository;

import com.transitops.fleet.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    Optional<Vehicle> findByRegIgnoreCase(String reg);
    Optional<Vehicle> findByNameIgnoreCase(String name);
    boolean existsByRegIgnoreCase(String reg);
}
