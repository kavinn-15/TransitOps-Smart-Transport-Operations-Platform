package com.transitops.fleet.model;

import jakarta.persistence.*;

@Entity
@Table(name = "trips")
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-facing code, e.g. TR001 - unique business key */
    @Column(nullable = false, unique = true, length = 20)
    private String tripCode;

    @Column(length = 120)
    private String source;

    @Column(length = 120)
    private String dest;

    /** Vehicle "name" (matches Vehicle.name), nullable until assigned */
    @Column(length = 60)
    private String vehicle;

    /** Driver "name" (matches Driver.name), nullable until assigned */
    @Column(length = 80)
    private String driver;

    @Column(nullable = false)
    private Integer cargo = 0;

    @Column(nullable = false)
    private Integer distance = 0;

    /** Draft | Dispatched | Completed | Cancelled */
    @Column(nullable = false, length = 20)
    private String status = "Draft";

    @Column(length = 60)
    private String eta = "";

    public Trip() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTripCode() { return tripCode; }
    public void setTripCode(String tripCode) { this.tripCode = tripCode; }
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
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getEta() { return eta; }
    public void setEta(String eta) { this.eta = eta; }
}
