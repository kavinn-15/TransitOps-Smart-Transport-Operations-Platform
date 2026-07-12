package com.transitops.fleet.service;

import com.transitops.fleet.dto.LoginRequest;
import com.transitops.fleet.exception.ApiException;
import com.transitops.fleet.model.AppUser;
import com.transitops.fleet.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AppUser login(LoginRequest req) {
        if (req.getEmail() == null || req.getPassword() == null) {
            throw new ApiException("Email and password are required.");
        }
        AppUser user = userRepository.findByEmailIgnoreCase(req.getEmail().trim())
                .orElseThrow(() -> new ApiException("Invalid email or password.", HttpStatus.UNAUTHORIZED));

        if (!user.getPassword().equals(req.getPassword())) {
            throw new ApiException("Invalid email or password.", HttpStatus.UNAUTHORIZED);
        }
        if (req.getRole() != null && !req.getRole().isBlank() && !user.getRole().equals(req.getRole())) {
            throw new ApiException(
                "This account is registered as \"" + user.getRole() + "\", not \"" + req.getRole() + "\".",
                HttpStatus.UNAUTHORIZED);
        }
        return user;
    }
}
