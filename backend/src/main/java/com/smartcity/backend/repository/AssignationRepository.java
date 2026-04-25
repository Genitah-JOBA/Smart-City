package com.smartcity.backend.repository;

import com.smartcity.backend.model.Assignation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssignationRepository extends JpaRepository<Assignation, Long> {
    
    // Supprimez les doublons - gardez seulement ces méthodes
    List<Assignation> findBySignalementId(Integer signalementId);
    
    void deleteBySignalementId(Integer signalementId);
}