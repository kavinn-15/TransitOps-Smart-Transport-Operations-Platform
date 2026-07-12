package com.transitops.fleet.dto;

public class TripRequest {
    private String source;
    private String dest;
    private String vehicle;   // vehicle "name"
    private String driver;    // driver "name"
    private Integer cargo;
    private Integer distance;

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getDest() { return dest; }
    public void setDest(String dest) { this.dest = dest; }
    public String getVehicle() { return vehicle; }
    public void setVehicle(String vehicle) { this.vehicle = vehicle; }
    public String getDriver() { return driver; }
    public void setDriver(String driver) { this.driver = driver; }
    public Integer getCargo() { return cargo; }
    public void setCargo(Integer cargo) { this.cargo = cargo; }
    public Integer getDistance() { return distance; }
    public void setDistance(Integer distance) { this.distance = distance; }
}
