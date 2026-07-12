package com.transitops.fleet.controller;

import com.transitops.fleet.dto.StatusUpdateRequest;
import com.transitops.fleet.model.Vehicle;
import com.transitops.fleet.service.VehicleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    /** GET /api/vehicles?type=Van&status=Available&search=GJ01 */
    @GetMapping
    public List<Vehicle> list(@RequestParam(required = false) String type,
                               @RequestParam(required = false) String status,
                               @RequestParam(required = false) String search) {
        return vehicleService.search(type, status, search);
    }

    /** GET /api/vehicles/available - vehicles eligible for trip dispatch */
    @GetMapping("/available")
    public List<Vehicle> available() {
        return vehicleService.findAvailableForDispatch();
    }

    @GetMapping("/{reg}")
    public Vehicle getOne(@PathVariable String reg) {
        return vehicleService.getByReg(reg);
    }

    @PostMapping
    public Vehicle create(@RequestHeader(value = "X-User-Role", defaultValue = "Administrator") String role,
                           @RequestBody Vehicle vehicle) {
        return vehicleService.create(role, vehicle);
    }

    @PatchMapping("/{reg}/status")
    public Vehicle updateStatus(@RequestHeader(value = "X-User-Role", defaultValue = "Administrator") String role,
                                 @PathVariable String reg,
                                 @RequestBody StatusUpdateRequest req) {
        return vehicleService.updateStatus(role, reg, req.getStatus());
    }

    @DeleteMapping("/{reg}")
    public void delete(@RequestHeader(value = "X-User-Role", defaultValue = "Administrator") String role,
                        @PathVariable String reg) {
        vehicleService.delete(role, reg);
    }
}
