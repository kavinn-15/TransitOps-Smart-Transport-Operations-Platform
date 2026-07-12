package com.transitops.fleet.controller;

import com.transitops.fleet.dto.StatusUpdateRequest;
import com.transitops.fleet.model.Driver;
import com.transitops.fleet.service.DriverService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    private final DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    /** Get All Drivers - every role with page access can view */
    @GetMapping
    public List<Driver> getAll() {
        return driverService.getAll();
    }

    /** Get Driver By ID (license) */
    @GetMapping("/{license}")
    public Driver getOne(@PathVariable String license) {
        return driverService.getByLicense(license);
    }

    @GetMapping("/available")
    public List<Driver> available() {
        return driverService.findAvailableForDispatch();
    }

    @PostMapping
    public Driver create(@RequestHeader(value = "X-User-Role", defaultValue = "Administrator") String role,
                          @RequestBody Driver driver) {
        return driverService.create(role, driver);
    }

    @PatchMapping("/{license}/status")
    public Driver updateStatus(@RequestHeader(value = "X-User-Role", defaultValue = "Administrator") String role,
                                @PathVariable String license,
                                @RequestBody StatusUpdateRequest req) {
        return driverService.updateStatus(role, license, req.getStatus());
    }

    @DeleteMapping("/{license}")
    public void delete(@RequestHeader(value = "X-User-Role", defaultValue = "Administrator") String role,
                        @PathVariable String license) {
        driverService.delete(role, license);
    }
}
