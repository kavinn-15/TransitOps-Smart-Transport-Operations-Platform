package com.transitops.fleet.controller;

import com.transitops.fleet.model.MaintenanceRecord;
import com.transitops.fleet.service.MaintenanceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @GetMapping
    public List<MaintenanceRecord> getAll() {
        return maintenanceService.getAll();
    }

    @PostMapping
    public MaintenanceRecord create(@RequestHeader(value = "X-User-Role", defaultValue = "Administrator") String role,
                                     @RequestBody MaintenanceRecord record) {
        return maintenanceService.create(role, record);
    }

    @PostMapping("/{id}/close")
    public MaintenanceRecord close(@RequestHeader(value = "X-User-Role", defaultValue = "Administrator") String role,
                                    @PathVariable Long id) {
        return maintenanceService.close(role, id);
    }
}
