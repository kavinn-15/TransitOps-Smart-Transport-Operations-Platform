package com.transitops.fleet.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

@Entity
@Table(name = "drivers")
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 80)
    private String name;

    /** License number - unique business key */
    @NotBlank
    @Column(nullable = false, unique = true, length = 30)
    private String license;

    /** LMV | HMV */
    @Column(nullable = false, length = 10)
    private String category = "LMV";

    @Column(nullable = false)
    private LocalDate expiry;

    @Column(length = 30)
    private String contact = "-";

    @Column(nullable = false)
    private Integer tripCompletion = 0;

    /** Available | On Trip | Off Duty | Suspended */
    @Column(nullable = false, length = 20)
    private String status = "Available";

    public Driver() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLicense() { return license; }
    public void setLicense(String license) { this.license = license; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public LocalDate getExpiry() { return expiry; }
    public void setExpiry(LocalDate expiry) { this.expiry = expiry; }
    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    public Integer getTripCompletion() { return tripCompletion; }
    public void setTripCompletion(Integer tripCompletion) { this.tripCompletion = tripCompletion; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
