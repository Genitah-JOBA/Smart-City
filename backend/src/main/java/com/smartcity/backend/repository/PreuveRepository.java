package com.smartcity.backend.repository;

import com.smartcity.backend.model.Preuve;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PreuveRepository extends JpaRepository<Preuve, Integer> {
    List<Preuve> findBySignalementId(Integer signalementId);
    List<Preuve> findByAgentEmail(String agentEmail);
}