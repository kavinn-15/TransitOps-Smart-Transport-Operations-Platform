package com.transitops.fleet.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Registration number - unique business key, e.g. GJ01AB4521 */
    @NotBlank
    @Column(nullable = false, unique = true, length = 20)
    private String reg;

    @NotBlank
    @Column(nullable = false, length = 60)
    private String name;

    /** Van | Truck | Mini */
    @Column(nullable = false, length = 30)
    private String type = "Van";

    @NotNull
    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private Long odometer = 0L;

    @Column(nullable = false)
    private Double cost = 0.0;

    /** Available | On Trip | In Shop | Retired */
    @Column(nullable = false, length = 20)
    private String status = "Available";

    public Vehicle() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getReg() { return reg; }
    public void setReg(String reg) { this.reg = reg; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public Long getOdometer() { return odometer; }
    public void setOdometer(Long odometer) { this.odometer = odometer; }
    public Double getCost() { return cost; }
    public void setCost(Double cost) { this.cost = cost; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
