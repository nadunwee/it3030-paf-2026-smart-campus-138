package com.smartcampus.controller;

import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUserRole(@PathVariable Long id,
                                               @RequestBody java.util.Map<String, String> body) {
        java.util.Optional<User> optional = userRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.<User>notFound().build();
        }
        User user = optional.get();
        try {
            user.setRole(User.Role.valueOf(body.get("role").toUpperCase()));
            return ResponseEntity.ok(userRepository.save(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.<User>badRequest().build();
        }
    }
}
