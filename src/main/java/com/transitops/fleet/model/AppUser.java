package com.transitops.fleet.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(nullable = false, length = 120)
    private String password;

    /** Administrator | Dispatcher | Fleet Manager | Safety Officer | Financial Analyst */
    @Column(nullable = false, length = 40)
    private String role;

    @Column(nullable = false, length = 120)
    private String name;

    public AppUser() {}

    public AppUser(String email, String password, String role, String name) {
        this.email = email; this.password = password; this.role = role; this.name = name;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
