package com.transitops.fleet.repository;

import com.transitops.fleet.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByVehicleIgnoreCase(String vehicle);
}
