// SignalementRepository.java - Ajouter ces méthodes
package com.smartcity.backend.repository;

import com.smartcity.backend.model.Signalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Integer> {
    
    // 🔥 AJOUTER CES MÉTHODES
    List<Signalement> findByAgentId(Long agentId);
    
    List<Signalement> findByAgentEmail(String agentEmail);
    
    long countByAgentIdAndStatut(Long agentId, String statut);
    
    long countByAgentEmailAndStatut(String agentEmail, String statut);
}