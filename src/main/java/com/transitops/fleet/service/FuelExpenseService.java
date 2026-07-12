package com.transitops.fleet.service;

import com.transitops.fleet.exception.ApiException;
import com.transitops.fleet.model.Expense;
import com.transitops.fleet.model.FuelLog;
import com.transitops.fleet.repository.ExpenseRepository;
import com.transitops.fleet.repository.FuelLogRepository;
import com.transitops.fleet.repository.TripRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class FuelExpenseService {

    private final FuelLogRepository fuelLogRepository;
    private final ExpenseRepository expenseRepository;
    private final TripRepository tripRepository;

    public FuelExpenseService(FuelLogRepository fuelLogRepository, ExpenseRepository expenseRepository, TripRepository tripRepository) {
        this.fuelLogRepository = fuelLogRepository;
        this.expenseRepository = expenseRepository;
        this.tripRepository = tripRepository;
    }

    public List<FuelLog> getAllFuelLogs() {
        return fuelLogRepository.findAll();
    }

    public FuelLog addFuelLog(FuelLog log) {
        if (log.getVehicle() == null || log.getVehicle().isBlank() || log.getLiters() == null || log.getLiters() <= 0) {
            throw new ApiException("Vehicle and Liters are required.");
        }
        if (log.getDate() == null) log.setDate(LocalDate.now());
        log.setId(null);
        return fuelLogRepository.save(log);
    }

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public Expense addExpense(Expense expense) {
        if (expense.getTrip() == null || expense.getTrip().isBlank()) {
            throw new ApiException("Trip is required.");
        }
        tripRepository.findByTripCode(expense.getTrip()).ifPresent(t -> expense.setVehicle(t.getVehicle()));
        expense.setId(null);
        return expenseRepository.save(expense);
    }

    public double totalFuelCostFor(String vehicleName) {
        return fuelLogRepository.findByVehicleIgnoreCase(vehicleName).stream().mapToDouble(FuelLog::getCost).sum();
    }
}
