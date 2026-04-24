package com.it3030.paf.smartcampus.repository;

import com.it3030.paf.smartcampus.domain.Notification;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

  Page<Notification> findByTargetUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

  long countByTargetUserIdAndReadFalse(Long userId);

  Optional<Notification> findByNotificationIdAndTargetUserId(Long notificationId, Long userId);

  long deleteByNotificationIdAndTargetUserId(Long notificationId, Long userId);

  long deleteByTargetUserId(Long userId);

  @Modifying
  @Query("update Notification n set n.read = true where n.targetUser.id = :userId and n.read = false")
  int markAllAsReadByUserId(@Param("userId") Long userId);
}
