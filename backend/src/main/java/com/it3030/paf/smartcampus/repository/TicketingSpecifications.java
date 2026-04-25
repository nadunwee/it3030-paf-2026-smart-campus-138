package com.it3030.paf.smartcampus.repository;

import com.it3030.paf.smartcampus.domain.Ticketing;
import com.it3030.paf.smartcampus.domain.enums.TicketCategory;
import com.it3030.paf.smartcampus.domain.enums.TicketPriority;
import com.it3030.paf.smartcampus.domain.enums.TicketStatus;
import org.springframework.data.jpa.domain.Specification;

public final class TicketingSpecifications {

  private TicketingSpecifications() {}

  public static Specification<Ticketing> statusEquals(TicketStatus status) {
    if (status == null) {
      return null;
    }
    return (root, query, cb) -> cb.equal(root.get("status"), status);
  }

  public static Specification<Ticketing> categoryEquals(TicketCategory category) {
    if (category == null) {
      return null;
    }
    return (root, query, cb) -> cb.equal(root.get("category"), category);
  }

  public static Specification<Ticketing> priorityEquals(TicketPriority priority) {
    if (priority == null) {
      return null;
    }
    return (root, query, cb) -> cb.equal(root.get("priority"), priority);
  }

  public static Specification<Ticketing> assignedTo(Long userId) {
    if (userId == null) {
      return null;
    }
    return (root, query, cb) -> cb.equal(root.get("assignedAdmin").get("id"), userId);
  }
}
