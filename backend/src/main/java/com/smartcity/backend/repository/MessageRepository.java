// MessageRepository.java
package com.smartcity.backend.repository;

import com.smartcity.backend.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByDestinataireEmailOrderByDateEnvoiDesc(String email);
    
    List<Message> findByExpediteurEmailOrderByDateEnvoiDesc(String email);
    
    @Query("SELECT m FROM Message m WHERE m.destinataireEmail = :email AND m.lu = false")
    List<Message> findNonLusByDestinataireEmail(@Param("email") String email);
    
    long countByDestinataireEmailAndLuFalse(String email);
}