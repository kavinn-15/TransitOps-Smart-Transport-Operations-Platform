package com.transitops.fleet.model;

import jakarta.persistence.*;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Trip code, e.g. TR001 */
    @Column(nullable = false, length = 20)
    private String trip;

    @Column(length = 60)
    private String vehicle;

    @Column(nullable = false)
    private Double toll = 0.0;

    @Column(nullable = false)
    private Double other = 0.0;

    public Expense() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTrip() { return trip; }
    public void setTrip(String trip) { this.trip = trip; }
    public String getVehicle() { return vehicle; }
    public void setVehicle(String vehicle) { this.vehicle = vehicle; }
    public Double getToll() { return toll; }
    public void setToll(Double toll) { this.toll = toll; }
    public Double getOther() { return other; }
    public void setOther(Double other) { this.other = other; }
}
