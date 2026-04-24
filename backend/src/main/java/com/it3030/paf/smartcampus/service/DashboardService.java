package com.it3030.paf.smartcampus.service;

import com.it3030.paf.smartcampus.api.dto.DashboardSummaryResponse;
import com.it3030.paf.smartcampus.domain.UserAccount;
import com.it3030.paf.smartcampus.domain.enums.BookingStatus;
import com.it3030.paf.smartcampus.exception.ResourceNotFoundException;
import com.it3030.paf.smartcampus.repository.BookingRepository;
import com.it3030.paf.smartcampus.repository.FacilityResourceRepository;
import com.it3030.paf.smartcampus.repository.TicketingRepository;
import com.it3030.paf.smartcampus.repository.UserAccountRepository;
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
  private final TicketingRepository ticketingRepository;
  private final UserAccountRepository userAccountRepository;

  public DashboardService(
      FacilityResourceRepository facilityResourceRepository,
      BookingRepository bookingRepository,
      TicketingRepository ticketingRepository,
      UserAccountRepository userAccountRepository) {
    this.facilityResourceRepository = facilityResourceRepository;
    this.bookingRepository = bookingRepository;
    this.ticketingRepository = ticketingRepository;
    this.userAccountRepository = userAccountRepository;
  }

  @Transactional(readOnly = true)
  public DashboardSummaryResponse getSummary(String username, boolean isAdmin) {
    UserAccount currentUser =
        userAccountRepository
            .findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

    long activeFacilitiesCount = facilityResourceRepository.count();
    String currentMonthLabel = YearMonth.now().format(MONTH_FORMATTER);
    Long pendingApprovals = isAdmin ? bookingRepository.countByStatus(BookingStatus.PENDING) : null;
    long myBookingsCount = bookingRepository.countByBookedByUserId(currentUser.getId());
    long openTicketsCount = ticketingRepository.countByStudentId(currentUser.getId());

    return new DashboardSummaryResponse(
        activeFacilitiesCount, currentMonthLabel, pendingApprovals, myBookingsCount, openTicketsCount);
  }
}
