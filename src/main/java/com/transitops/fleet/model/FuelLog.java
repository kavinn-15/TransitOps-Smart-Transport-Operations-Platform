package com.transitops.fleet.model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "fuel_logs")
public class FuelLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String vehicle;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private Double liters = 0.0;

    @Column(nullable = false)
    private Double cost = 0.0;

    public FuelLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getVehicle() { return vehicle; }
    public void setVehicle(String vehicle) { this.vehicle = vehicle; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public Double getLiters() { return liters; }
    public void setLiters(Double liters) { this.liters = liters; }
    public Double getCost() { return cost; }
    public void setCost(Double cost) { this.cost = cost; }
}
