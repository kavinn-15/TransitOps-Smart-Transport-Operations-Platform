package com.transitops.fleet.service;

import com.transitops.fleet.exception.ApiException;
import com.transitops.fleet.model.Driver;
import com.transitops.fleet.repository.DriverRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class DriverService {

    private final DriverRepository driverRepository;
    private final RbacService rbac;

    public DriverService(DriverRepository driverRepository, RbacService rbac) {
        this.driverRepository = driverRepository;
        this.rbac = rbac;
    }

    public List<Driver> getAll() {
        return driverRepository.findAll();
    }

    public Driver getByLicense(String license) {
        return driverRepository.findByLicenseIgnoreCase(license)
                .orElseThrow(() -> new ApiException("Driver not found: " + license, HttpStatus.NOT_FOUND));
    }

    public boolean isLicenseExpired(Driver d) {
        return d.getExpiry() != null && d.getExpiry().isBefore(LocalDate.now());
    }

    public boolean isAssignable(Driver d) {
        return "Available".equals(d.getStatus()) && !isLicenseExpired(d);
    }

    public List<Driver> findAvailableForDispatch() {
        return driverRepository.findAll().stream().filter(this::isAssignable).toList();
    }

    public Driver create(String role, Driver d) {
        if (!rbac.driverCan(role, "create")) {
            throw new ApiException("You do not have permission to create drivers.", HttpStatus.FORBIDDEN);
        }
        if (d.getName() == null || d.getName().isBlank() || d.getLicense() == null || d.getLicense().isBlank() || d.getExpiry() == null) {
            throw new ApiException("Name, License No. and Expiry are required.");
        }
        d.setLicense(d.getLicense().trim().toUpperCase());
        if (driverRepository.existsByLicenseIgnoreCase(d.getLicense())) {
            throw new ApiException("License No. \"" + d.getLicense() + "\" already exists.");
        }
        d.setId(null);
        d.setStatus("Available");
        if (d.getTripCompletion() == null) d.setTripCompletion(0);
        if (d.getContact() == null || d.getContact().isBlank()) d.setContact("-");
        return driverRepository.save(d);
    }

    public Driver updateStatus(String role, String license, String status) {
        if (!rbac.driverCan(role, "update")) {
            throw new ApiException("You do not have permission to update drivers.", HttpStatus.FORBIDDEN);
        }
        Driver d = getByLicense(license);
        d.setStatus(status);
        return driverRepository.save(d);
    }

    public void delete(String role, String license) {
        if (!rbac.driverCan(role, "delete")) {
            throw new ApiException("You do not have permission to delete drivers.", HttpStatus.FORBIDDEN);
        }
        Driver d = getByLicense(license);
        driverRepository.delete(d);
    }
}
