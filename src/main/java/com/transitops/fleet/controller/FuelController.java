package com.transitops.fleet.controller;

import com.transitops.fleet.model.FuelLog;
import com.transitops.fleet.service.FuelExpenseService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fuel")
public class FuelController {

    private final FuelExpenseService fuelExpenseService;

    public FuelController(FuelExpenseService fuelExpenseService) {
        this.fuelExpenseService = fuelExpenseService;
    }

    @GetMapping
    public List<FuelLog> getAll() {
        return fuelExpenseService.getAllFuelLogs();
    }

    @PostMapping
    public FuelLog create(@RequestBody FuelLog log) {
        return fuelExpenseService.addFuelLog(log);
    }
}
