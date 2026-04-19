package com.smartcity.backend.repository;

import com.smartcity.backend.model.Assignation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssignationRepository extends JpaRepository<Assignation, Integer> {
    boolean existsByAgentIdAndSignalementId(Integer agentId, Integer signalementId);
    List<Assignation> findByAgentId(Integer agentId);
    Optional<Assignation> findBySignalementId(Integer signalementId);
    void deleteBySignalementId(Integer signalementId);
}