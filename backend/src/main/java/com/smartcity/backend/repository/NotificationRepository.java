package com.smartcity.backend.repository;

import com.smartcity.backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByUserEmailOrderByDateCreationDesc(String userEmail);
    
    long countByUserEmailAndLuFalse(String userEmail);
    
    List<Notification> findByUserEmailAndLuFalse(String userEmail);
    
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lu = true WHERE n.userEmail = :userEmail AND n.lu = false")
    void markAllAsReadByUserEmail(@Param("userEmail") String userEmail);
}