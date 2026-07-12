package com.transitops.fleet.service;

import com.transitops.fleet.model.Driver;
import com.transitops.fleet.model.Trip;
import com.transitops.fleet.model.Vehicle;
import com.transitops.fleet.repository.DriverRepository;
import com.transitops.fleet.repository.TripRepository;
import com.transitops.fleet.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final TripRepository tripRepository;

    public DashboardService(VehicleRepository vehicleRepository, DriverRepository driverRepository, TripRepository tripRepository) {
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.tripRepository = tripRepository;
    }

    public Map<String, Object> summary(String type, String status) {
        List<Vehicle> allVehicles = vehicleRepository.findAll();
        List<Vehicle> filtered = allVehicles.stream()
                .filter(v -> type == null || type.isBlank() || "All".equalsIgnoreCase(type) || v.getType().equalsIgnoreCase(type))
                .filter(v -> status == null || status.isBlank() || "All".equalsIgnoreCase(status) || v.getStatus().equalsIgnoreCase(status))
                .toList();

        long active = allVehicles.stream().filter(v -> !"Retired".equals(v.getStatus())).count();
        long available = allVehicles.stream().filter(v -> "Available".equals(v.getStatus())).count();
        long inMaint = allVehicles.stream().filter(v -> "In Shop".equals(v.getStatus())).count();
        long onTrip = allVehicles.stream().filter(v -> "On Trip".equals(v.getStatus())).count();

        List<Trip> trips = tripRepository.findAll();
        long activeTrips = trips.stream().filter(t -> "Dispatched".equals(t.getStatus())).count();
        long pendingTrips = trips.stream().filter(t -> "Draft".equals(t.getStatus())).count();

        List<Driver> drivers = driverRepository.findAll();
        long driversOnDuty = drivers.stream().filter(d -> "Available".equals(d.getStatus()) || "On Trip".equals(d.getStatus())).count();

        int utilization = active > 0 ? Math.round((onTrip * 100f) / active) : 0;

        Map<String, Long> statusCounts = new LinkedHashMap<>();
        statusCounts.put("Available", allVehicles.stream().filter(v -> "Available".equals(v.getStatus())).count());
        statusCounts.put("On Trip", onTrip);
        statusCounts.put("In Shop", inMaint);
        statusCounts.put("Retired", allVehicles.stream().filter(v -> "Retired".equals(v.getStatus())).count());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("activeVehicles", active);
        result.put("availableVehicles", available);
        result.put("vehiclesInMaintenance", inMaint);
        result.put("activeTrips", activeTrips);
        result.put("pendingTrips", pendingTrips);
        result.put("driversOnDuty", driversOnDuty);
        result.put("fleetUtilization", utilization);
        result.put("vehicleStatusCounts", statusCounts);
        result.put("recentTrips", trips.stream()
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .limit(4)
                .toList());
        result.put("filteredVehicleCount", filtered.size());
        return result;
    }
}
