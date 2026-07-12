package com.transitops.fleet.model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "maintenance_records")
public class MaintenanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Vehicle "name" (matches Vehicle.name) */
    @Column(nullable = false, length = 60)
    private String vehicle;

    @Column(nullable = false, length = 80)
    private String service;

    @Column(nullable = false)
    private Double cost = 0.0;

    @Column(nullable = false)
    private LocalDate date;

    /** In Shop | Completed */
    @Column(nullable = false, length = 20)
    private String status = "In Shop";

    public MaintenanceRecord() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getVehicle() { return vehicle; }
    public void setVehicle(String vehicle) { this.vehicle = vehicle; }
    public String getService() { return service; }
    public void setService(String service) { this.service = service; }
    public Double getCost() { return cost; }
    public void setCost(Double cost) { this.cost = cost; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
