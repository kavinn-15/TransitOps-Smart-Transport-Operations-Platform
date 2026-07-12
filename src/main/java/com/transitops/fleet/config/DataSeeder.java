package com.transitops.fleet.config;

import com.transitops.fleet.model.*;
import com.transitops.fleet.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Seeds the MySQL database with the same demo users / vehicles / drivers /
 * trips / maintenance / fuel / expenses that shipped in the original
 * in-memory frontend mock (DB object in app.js), so the app looks identical
 * the first time it is run. Only runs when the users table is empty, so it
 * never overwrites real data on subsequent restarts.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final TripRepository tripRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final FuelLogRepository fuelLogRepository;
    private final ExpenseRepository expenseRepository;

    public DataSeeder(UserRepository userRepository, VehicleRepository vehicleRepository,
                       DriverRepository driverRepository, TripRepository tripRepository,
                       MaintenanceRepository maintenanceRepository, FuelLogRepository fuelLogRepository,
                       ExpenseRepository expenseRepository) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.tripRepository = tripRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.fuelLogRepository = fuelLogRepository;
        this.expenseRepository = expenseRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return; // already seeded

        userRepository.save(new AppUser("raven.k@transitops.in", "demo123", "Dispatcher", "Raven K."));
        userRepository.save(new AppUser("meera.s@transitops.in", "demo123", "Fleet Manager", "Meera S."));
        userRepository.save(new AppUser("arjun.p@transitops.in", "demo123", "Safety Officer", "Arjun P."));
        userRepository.save(new AppUser("kabir.n@transitops.in", "demo123", "Financial Analyst", "Kabir N."));
        userRepository.save(new AppUser("admin@transitops.in", "demo123", "Administrator", "Admin User"));

        Vehicle v1 = vehicle("GJ01AB4521", "VAN-05", "Van", 500, 74000L, 620000.0, "Available");
        Vehicle v2 = vehicle("GJ01AB9987", "TRUCK-11", "Truck", 5000, 182000L, 2450000.0, "On Trip");
        Vehicle v3 = vehicle("GJ01AB1123", "MINI-03", "Mini", 1000, 66000L, 410000.0, "In Shop");
        Vehicle v4 = vehicle("GJ01AB0087", "VAN-09", "Van", 750, 241900L, 590000.0, "Retired");
        Vehicle v5 = vehicle("GJ01AB6541", "TRUCK-04", "Truck", 4000, 98000L, 2100000.0, "Available");
        vehicleRepository.save(v1); vehicleRepository.save(v2); vehicleRepository.save(v3);
        vehicleRepository.save(v4); vehicleRepository.save(v5);

        driverRepository.save(driver("Alex", "DL-88213", "LMV", "2028-12-01", "98765xxxxx", 96, "Available"));
        driverRepository.save(driver("John", "DL-44120", "HMV", "2025-03-01", "98220xxxxx", 81, "Suspended"));
        driverRepository.save(driver("Priya", "DL-77031", "LMV", "2028-08-01", "99110xxxxx", 99, "On Trip"));
        driverRepository.save(driver("Suresh", "DL-90045", "HMV", "2027-01-01", "97440xxxxx", 88, "Off Duty"));

        tripRepository.save(trip("TR001", "Gandhinagar Depot", "Ahmedabad Hub", "VAN-05", "Alex", 450, 45, "Dispatched", "45 min"));
        tripRepository.save(trip("TR004", "Vatva Industrial Area", "Sanand Warehouse", "TRUCK-04", "Suresh", 0, 0, "Draft", "Awaiting driver"));
        tripRepository.save(trip("TR006", "Mansa", "Kalol Depot", null, null, 0, 0, "Cancelled", "Vehicle went to shop"));

        maintenanceRepository.save(maint("VAN-05", "Oil Change", 2500.0, "2026-07-07", "In Shop"));
        maintenanceRepository.save(maint("TRUCK-11", "Engine Repair", 18000.0, "2026-07-06", "Completed"));
        maintenanceRepository.save(maint("MINI-03", "Tyre Replace", 6200.0, "2026-07-05", "In Shop"));

        fuelLogRepository.save(fuel("VAN-05", "2026-07-05", 42.0, 3150.0));
        fuelLogRepository.save(fuel("TRUCK-11", "2026-07-06", 110.0, 8400.0));
        fuelLogRepository.save(fuel("MINI-03", "2026-07-06", 28.0, 2050.0));

        expenseRepository.save(expense("TR001", "VAN-05", 120.0, 0.0));
        expenseRepository.save(expense("TR002", "TRUCK-11", 340.0, 150.0));
    }

    private Vehicle vehicle(String reg, String name, String type, int capacity, long odometer, double cost, String status) {
        Vehicle v = new Vehicle();
        v.setReg(reg); v.setName(name); v.setType(type); v.setCapacity(capacity);
        v.setOdometer(odometer); v.setCost(cost); v.setStatus(status);
        return v;
    }

    private Driver driver(String name, String license, String category, String expiry, String contact, int tripCompletion, String status) {
        Driver d = new Driver();
        d.setName(name); d.setLicense(license); d.setCategory(category);
        d.setExpiry(LocalDate.parse(expiry)); d.setContact(contact);
        d.setTripCompletion(tripCompletion); d.setStatus(status);
        return d;
    }

    private Trip trip(String code, String source, String dest, String vehicle, String driver, int cargo, int distance, String status, String eta) {
        Trip t = new Trip();
        t.setTripCode(code); t.setSource(source); t.setDest(dest);
        t.setVehicle(vehicle); t.setDriver(driver); t.setCargo(cargo);
        t.setDistance(distance); t.setStatus(status); t.setEta(eta);
        return t;
    }

    private MaintenanceRecord maint(String vehicle, String service, double cost, String date, String status) {
        MaintenanceRecord m = new MaintenanceRecord();
        m.setVehicle(vehicle); m.setService(service); m.setCost(cost);
        m.setDate(LocalDate.parse(date)); m.setStatus(status);
        return m;
    }

    private FuelLog fuel(String vehicle, String date, double liters, double cost) {
        FuelLog f = new FuelLog();
        f.setVehicle(vehicle); f.setDate(LocalDate.parse(date)); f.setLiters(liters); f.setCost(cost);
        return f;
    }

    private Expense expense(String trip, String vehicle, double toll, double other) {
        Expense e = new Expense();
        e.setTrip(trip); e.setVehicle(vehicle); e.setToll(toll); e.setOther(other);
        return e;
    }
}
