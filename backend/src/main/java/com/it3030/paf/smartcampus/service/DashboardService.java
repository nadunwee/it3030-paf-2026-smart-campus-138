package com.it3030.paf.smartcampus.service;

import com.it3030.paf.smartcampus.api.dto.DashboardSummaryResponse;
import com.it3030.paf.smartcampus.domain.enums.BookingStatus;
import com.it3030.paf.smartcampus.repository.BookingRepository;
import com.it3030.paf.smartcampus.repository.FacilityResourceRepository;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

  private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);

  private final FacilityResourceRepository facilityResourceRepository;
  private final BookingRepository bookingRepository;

  public DashboardService(
      FacilityResourceRepository facilityResourceRepository, BookingRepository bookingRepository) {
    this.facilityResourceRepository = facilityResourceRepository;
    this.bookingRepository = bookingRepository;
  }

  @Transactional(readOnly = true)
  public DashboardSummaryResponse getSummary(boolean isAdmin) {
    long activeFacilitiesCount = facilityResourceRepository.count();
    String currentMonthLabel = YearMonth.now().format(MONTH_FORMATTER);
    Long pendingApprovals = isAdmin ? bookingRepository.countByStatus(BookingStatus.PENDING) : null;
    return new DashboardSummaryResponse(activeFacilitiesCount, currentMonthLabel, pendingApprovals);
  }
}
