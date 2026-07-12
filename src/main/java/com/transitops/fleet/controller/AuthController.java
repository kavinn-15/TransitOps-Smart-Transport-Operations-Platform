package com.transitops.fleet.controller;

import com.transitops.fleet.dto.LoginRequest;
import com.transitops.fleet.model.AppUser;
import com.transitops.fleet.service.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest req) {
        AppUser user = authService.login(req);
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("email", user.getEmail());
        res.put("name", user.getName());
        res.put("role", user.getRole());
        return res;
    }
}
