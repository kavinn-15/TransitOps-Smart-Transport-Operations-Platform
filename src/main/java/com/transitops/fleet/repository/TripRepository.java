package com.transitops.fleet.repository;

import com.transitops.fleet.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TripRepository extends JpaRepository<Trip, Long> {
    Optional<Trip> findByTripCode(String tripCode);
    long countByStatus(String status);
}
