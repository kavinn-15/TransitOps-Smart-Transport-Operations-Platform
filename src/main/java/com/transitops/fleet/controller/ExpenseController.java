package com.transitops.fleet.controller;

import com.transitops.fleet.model.Expense;
import com.transitops.fleet.service.FuelExpenseService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final FuelExpenseService fuelExpenseService;

    public ExpenseController(FuelExpenseService fuelExpenseService) {
        this.fuelExpenseService = fuelExpenseService;
    }

    @GetMapping
    public List<Expense> getAll() {
        return fuelExpenseService.getAllExpenses();
    }

    @PostMapping
    public Expense create(@RequestBody Expense expense) {
        return fuelExpenseService.addExpense(expense);
    }
}
