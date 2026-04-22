package com.it3030.paf.smartcampus.api.controller;

import com.it3030.paf.smartcampus.api.dto.DashboardSummaryResponse;
import com.it3030.paf.smartcampus.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

  private final DashboardService dashboardService;

  public DashboardController(DashboardService dashboardService) {
    this.dashboardService = dashboardService;
  }

  @GetMapping("/summary")
  @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
  public ResponseEntity<DashboardSummaryResponse> summary(Authentication authentication) {
    boolean isAdmin =
        authentication != null
            && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    return ResponseEntity.ok(dashboardService.getSummary(isAdmin));
  }
}
