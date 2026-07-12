package com.transitops.fleet.controller;

import com.transitops.fleet.dto.CompleteTripRequest;
import com.transitops.fleet.dto.TripRequest;
import com.transitops.fleet.model.Trip;
import com.transitops.fleet.service.TripService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    /** Live board data */
    @GetMapping
    public List<Trip> getAll() {
        return tripService.getAll();
    }

    @GetMapping("/{code}")
    public Trip getOne(@PathVariable String code) {
        return tripService.getByCode(code);
    }

    @PostMapping("/draft")
    public Trip saveDraft(@RequestHeader(value = "X-User-Role", defaultValue = "Administrator") String role,
                           @RequestBody TripRequest req) {
        return tripService.saveDraft(role, req);
    }

    @PostMapping("/dispatch")
    public Trip dispatch(@RequestHeader(value = "X-User-Role", defaultValue = "Administrator") String role,
                          @RequestBody TripRequest req) {
        return tripService.dispatch(role, req);
    }

    @PostMapping("/{code}/complete")
    public Trip complete(@RequestHeader(value = "X-User-Role", defaultValue = "Administrator") String role,
                          @PathVariable String code,
                          @RequestBody CompleteTripRequest req) {
        return tripService.complete(role, code, req);
    }

    @PostMapping("/{code}/cancel")
    public Trip cancel(@RequestHeader(value = "X-User-Role", defaultValue = "Administrator") String role,
                        @PathVariable String code) {
        return tripService.cancel(role, code);
    }
}
