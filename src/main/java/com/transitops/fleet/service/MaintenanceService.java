package com.transitops.fleet.service;

import com.transitops.fleet.exception.ApiException;
import com.transitops.fleet.model.MaintenanceRecord;
import com.transitops.fleet.model.Vehicle;
import com.transitops.fleet.repository.MaintenanceRepository;
import com.transitops.fleet.repository.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final VehicleRepository vehicleRepository;
    private final RbacService rbac;

    public MaintenanceService(MaintenanceRepository maintenanceRepository, VehicleRepository vehicleRepository, RbacService rbac) {
        this.maintenanceRepository = maintenanceRepository;
        this.vehicleRepository = vehicleRepository;
        this.rbac = rbac;
    }

    public List<MaintenanceRecord> getAll() {
        return maintenanceRepository.findAll();
    }

    @Transactional
    public MaintenanceRecord create(String role, MaintenanceRecord rec) {
        if (!rbac.canEdit(role, "maintenance")) {
            throw new ApiException("Your role has view-only access to Maintenance.", HttpStatus.FORBIDDEN);
        }
        if (rec.getVehicle() == null || rec.getVehicle().isBlank() || rec.getService() == null || rec.getService().isBlank()) {
            throw new ApiException("Vehicle and Service Type are required.");
        }
        if (rec.getDate() == null) rec.setDate(LocalDate.now());
        rec.setId(null);
        rec.setStatus("In Shop");
        MaintenanceRecord saved = maintenanceRepository.save(rec);

        vehicleRepository.findByNameIgnoreCase(rec.getVehicle()).ifPresent(v -> {
            if (!"Retired".equals(v.getStatus())) {
                v.setStatus("In Shop");
                vehicleRepository.save(v);
            }
        });
        return saved;
    }

    @Transactional
    public MaintenanceRecord close(String role, Long id) {
        if (!rbac.canEdit(role, "maintenance")) {
            throw new ApiException("Your role has view-only access to Maintenance.", HttpStatus.FORBIDDEN);
        }
        MaintenanceRecord rec = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ApiException("Maintenance record not found.", HttpStatus.NOT_FOUND));
        rec.setStatus("Completed");
        maintenanceRepository.save(rec);

        boolean stillOpen = maintenanceRepository.existsByVehicleIgnoreCaseAndStatus(rec.getVehicle(), "In Shop");
        if (!stillOpen) {
            vehicleRepository.findByNameIgnoreCase(rec.getVehicle()).ifPresent(v -> {
                if (!"Retired".equals(v.getStatus())) {
                    v.setStatus("Available");
                    vehicleRepository.save(v);
                }
            });
        }
        return rec;
    }

    public double totalCostFor(String vehicleName) {
        return maintenanceRepository.findByVehicleIgnoreCase(vehicleName).stream()
                .mapToDouble(MaintenanceRecord::getCost).sum();
    }
}
