package com.transitops.fleet.service;

import com.transitops.fleet.dto.CompleteTripRequest;
import com.transitops.fleet.dto.TripRequest;
import com.transitops.fleet.exception.ApiException;
import com.transitops.fleet.model.Driver;
import com.transitops.fleet.model.FuelLog;
import com.transitops.fleet.model.Trip;
import com.transitops.fleet.model.Vehicle;
import com.transitops.fleet.repository.DriverRepository;
import com.transitops.fleet.repository.FuelLogRepository;
import com.transitops.fleet.repository.TripRepository;
import com.transitops.fleet.repository.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class TripService {

    private final TripRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final FuelLogRepository fuelLogRepository;
    private final RbacService rbac;
    private final DriverService driverService;

    /** in-memory sequence for TR### codes, seeded from current max on first use */
    private final AtomicLong tripSeq = new AtomicLong(-1);

    public TripService(TripRepository tripRepository, VehicleRepository vehicleRepository,
                        DriverRepository driverRepository, FuelLogRepository fuelLogRepository,
                        RbacService rbac, DriverService driverService) {
        this.tripRepository = tripRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.fuelLogRepository = fuelLogRepository;
        this.rbac = rbac;
        this.driverService = driverService;
    }

    public List<Trip> getAll() {
        return tripRepository.findAll();
    }

    private synchronized String nextTripCode() {
        if (tripSeq.get() < 0) {
            long max = tripRepository.findAll().stream()
                    .map(Trip::getTripCode)
                    .filter(c -> c != null && c.startsWith("TR"))
                    .mapToLong(c -> {
                        try { return Long.parseLong(c.substring(2)); } catch (Exception e) { return 0; }
                    }).max().orElse(0);
            tripSeq.set(max + 1);
        }
        long n = tripSeq.getAndIncrement();
        return "TR" + String.format("%03d", n);
    }

    private void requireTripEdit(String role) {
        if (!rbac.canEdit(role, "trips")) {
            throw new ApiException("Your role has view-only access to Trips.", HttpStatus.FORBIDDEN);
        }
    }

    @Transactional
    public Trip saveDraft(String role, TripRequest req) {
        requireTripEdit(role);
        if (isBlank(req.getSource()) || isBlank(req.getDest())) {
            throw new ApiException("Source and Destination are required.");
        }
        Trip t = new Trip();
        t.setTripCode(nextTripCode());
        t.setSource(req.getSource());
        t.setDest(req.getDest());
        t.setVehicle(req.getVehicle());
        t.setDriver(req.getDriver());
        t.setCargo(nz(req.getCargo()));
        t.setDistance(nz(req.getDistance()));
        t.setStatus("Draft");
        t.setEta("Awaiting dispatch");
        return tripRepository.save(t);
    }

    @Transactional
    public Trip dispatch(String role, TripRequest req) {
        requireTripEdit(role);
        if (isBlank(req.getSource()) || isBlank(req.getDest())) {
            throw new ApiException("Source and Destination are required.");
        }
        Vehicle veh = vehicleRepository.findByNameIgnoreCase(nullToEmpty(req.getVehicle()))
                .orElseThrow(() -> new ApiException("Selected vehicle is not available."));
        if (!"Available".equals(veh.getStatus())) {
            throw new ApiException("Selected vehicle is not available.");
        }
        Driver drv = driverRepository.findByNameIgnoreCase(nullToEmpty(req.getDriver()))
                .orElseThrow(() -> new ApiException("Selected driver is not available or license expired/suspended."));
        if (!driverService.isAssignable(drv)) {
            throw new ApiException("Selected driver is not available or license expired/suspended.");
        }
        int cargo = nz(req.getCargo());
        if (cargo > veh.getCapacity()) {
            throw new ApiException("Cargo exceeds vehicle capacity - dispatch blocked.");
        }

        veh.setStatus("On Trip");
        drv.setStatus("On Trip");
        vehicleRepository.save(veh);
        driverRepository.save(drv);

        Trip t = new Trip();
        t.setTripCode(nextTripCode());
        t.setSource(req.getSource());
        t.setDest(req.getDest());
        t.setVehicle(veh.getName());
        t.setDriver(drv.getName());
        t.setCargo(cargo);
        int distance = nz(req.getDistance());
        t.setDistance(distance);
        t.setStatus("Dispatched");
        t.setEta(Math.max(10, Math.round(distance * 1.4)) + " min");
        return tripRepository.save(t);
    }

    @Transactional
    public Trip complete(String role, String tripCode, CompleteTripRequest req) {
        requireTripEdit(role);
        Trip trip = getByCode(tripCode);
        Vehicle veh = trip.getVehicle() == null ? null : vehicleRepository.findByNameIgnoreCase(trip.getVehicle()).orElse(null);
        Driver drv = trip.getDriver() == null ? null : driverRepository.findByNameIgnoreCase(trip.getDriver()).orElse(null);

        if (veh != null) {
            if (req.getOdometer() != null && req.getOdometer() > 0) veh.setOdometer(req.getOdometer());
            veh.setStatus("Available");
            vehicleRepository.save(veh);
        }
        if (drv != null) {
            drv.setStatus("Available");
            driverRepository.save(drv);
        }
        if (veh != null && req.getLiters() != null && req.getLiters() > 0) {
            FuelLog log = new FuelLog();
            log.setVehicle(veh.getName());
            log.setDate(LocalDate.now());
            log.setLiters(req.getLiters());
            log.setCost(req.getFuelCost() == null ? 0.0 : req.getFuelCost());
            fuelLogRepository.save(log);
        }
        trip.setStatus("Completed");
        trip.setEta("-");
        return tripRepository.save(trip);
    }

    @Transactional
    public Trip cancel(String role, String tripCode) {
        requireTripEdit(role);
        Trip trip = getByCode(tripCode);
        if ("Dispatched".equals(trip.getStatus())) {
            if (trip.getVehicle() != null) {
                vehicleRepository.findByNameIgnoreCase(trip.getVehicle()).ifPresent(v -> {
                    v.setStatus("Available");
                    vehicleRepository.save(v);
                });
            }
            if (trip.getDriver() != null) {
                driverRepository.findByNameIgnoreCase(trip.getDriver()).ifPresent(d -> {
                    d.setStatus("Available");
                    driverRepository.save(d);
                });
            }
        }
        trip.setStatus("Cancelled");
        trip.setEta("Cancelled");
        return tripRepository.save(trip);
    }

    public Trip getByCode(String code) {
        return tripRepository.findByTripCode(code)
                .orElseThrow(() -> new ApiException("Trip not found: " + code, HttpStatus.NOT_FOUND));
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
    private static int nz(Integer i) { return i == null ? 0 : i; }
    private static String nullToEmpty(String s) { return s == null ? "" : s; }
}
