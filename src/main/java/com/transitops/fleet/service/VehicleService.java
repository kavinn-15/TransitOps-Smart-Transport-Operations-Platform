package com.transitops.fleet.service;

import com.transitops.fleet.exception.ApiException;
import com.transitops.fleet.model.Vehicle;
import com.transitops.fleet.repository.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final RbacService rbac;

    public VehicleService(VehicleRepository vehicleRepository, RbacService rbac) {
        this.vehicleRepository = vehicleRepository;
        this.rbac = rbac;
    }

    public List<Vehicle> search(String type, String status, String regQuery) {
        List<Vehicle> all = vehicleRepository.findAll();
        return all.stream()
                .filter(v -> type == null || type.isBlank() || "All".equalsIgnoreCase(type) || v.getType().equalsIgnoreCase(type))
                .filter(v -> status == null || status.isBlank() || "All".equalsIgnoreCase(status) || v.getStatus().equalsIgnoreCase(status))
                .filter(v -> regQuery == null || regQuery.isBlank() || v.getReg().toLowerCase().contains(regQuery.toLowerCase()))
                .toList();
    }

    public List<Vehicle> findAvailableForDispatch() {
        return vehicleRepository.findAll().stream()
                .filter(v -> "Available".equals(v.getStatus()))
                .toList();
    }

    public Vehicle getByReg(String reg) {
        return vehicleRepository.findByRegIgnoreCase(reg)
                .orElseThrow(() -> new ApiException("Vehicle not found: " + reg, HttpStatus.NOT_FOUND));
    }

    public Vehicle create(String role, Vehicle v) {
        requireEdit(role);
        if (v.getReg() == null || v.getReg().isBlank() || v.getName() == null || v.getName().isBlank() || v.getCapacity() == null) {
            throw new ApiException("Registration No., Name and Capacity are required.");
        }
        v.setReg(v.getReg().trim().toUpperCase());
        if (vehicleRepository.existsByRegIgnoreCase(v.getReg())) {
            throw new ApiException("Registration No. must be unique - \"" + v.getReg() + "\" already exists.");
        }
        v.setId(null);
        v.setStatus("Available");
        if (v.getOdometer() == null) v.setOdometer(0L);
        if (v.getCost() == null) v.setCost(0.0);
        return vehicleRepository.save(v);
    }

    public Vehicle updateStatus(String role, String reg, String status) {
        requireEdit(role);
        Vehicle v = getByReg(reg);
        v.setStatus(status);
        return vehicleRepository.save(v);
    }

    public void delete(String role, String reg) {
        requireEdit(role);
        Vehicle v = getByReg(reg);
        vehicleRepository.delete(v);
    }

    private void requireEdit(String role) {
        if (!rbac.canEdit(role, "fleet")) {
            throw new ApiException("Your role (" + role + ") has view-only access to Fleet.", HttpStatus.FORBIDDEN);
        }
    }
}
