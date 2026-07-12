package com.transitops.fleet.dto;

public class CompleteTripRequest {
    private Long odometer;
    private Double liters;
    private Double fuelCost;

    public Long getOdometer() { return odometer; }
    public void setOdometer(Long odometer) { this.odometer = odometer; }
    public Double getLiters() { return liters; }
    public void setLiters(Double liters) { this.liters = liters; }
    public Double getFuelCost() { return fuelCost; }
    public void setFuelCost(Double fuelCost) { this.fuelCost = fuelCost; }
}
