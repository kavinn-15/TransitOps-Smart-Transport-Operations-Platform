package com.transitops.fleet.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Mirrors the frontend's PERMS and DRIVER_PERMS matrices (app.js) so the
 * backend enforces the same rules, not just the UI. The frontend sends the
 * acting user's role in the "X-User-Role" header on every request; each
 * controller asks this service whether the action is allowed before it
 * touches the database.
 */
@Service
public class RbacService {

    /** page-level permission: full | view */
    private static final Map<String, Map<String, String>> PAGE_PERMS = new HashMap<>();
    /** driver-level fine-grained permissions */
    private static final Map<String, Map<String, Boolean>> DRIVER_PERMS = new HashMap<>();

    static {
        PAGE_PERMS.put("Fleet Manager",     Map.of("fleet","full","drivers","full","trips","view","maintenance","full","fuel","view","analytics","full"));
        PAGE_PERMS.put("Dispatcher",        Map.of("fleet","view","drivers","view","trips","full","maintenance","view","fuel","view","analytics","view"));
        PAGE_PERMS.put("Safety Officer",    Map.of("fleet","view","drivers","full","trips","view","maintenance","view","fuel","view","analytics","view"));
        PAGE_PERMS.put("Financial Analyst", Map.of("fleet","view","drivers","view","trips","view","maintenance","view","fuel","full","analytics","full"));
        PAGE_PERMS.put("Administrator",     Map.of("fleet","full","drivers","full","trips","full","maintenance","full","fuel","full","analytics","full"));

        DRIVER_PERMS.put("Fleet Manager",     Map.of("create",true,  "update",true,  "delete",true));
        DRIVER_PERMS.put("Safety Officer",    Map.of("create",true,  "update",true,  "delete",false));
        DRIVER_PERMS.put("Financial Analyst", Map.of("create",false, "update",false, "delete",false));
        DRIVER_PERMS.put("Dispatcher",        Map.of("create",false, "update",false, "delete",false));
        DRIVER_PERMS.put("Administrator",     Map.of("create",true,  "update",true,  "delete",true));
    }

    /** true if the role has "full" (edit) access to the given page/module */
    public boolean canEdit(String role, String page) {
        Map<String, String> perms = PAGE_PERMS.get(role);
        return perms != null && "full".equals(perms.get(page));
    }

    public boolean driverCan(String role, String action) {
        Map<String, Boolean> perms = DRIVER_PERMS.get(role);
        return perms != null && Boolean.TRUE.equals(perms.get(action));
    }
}
