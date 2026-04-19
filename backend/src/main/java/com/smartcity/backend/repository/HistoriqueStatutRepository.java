package com.smartcity.backend.repository;

import com.smartcity.backend.model.HistoriqueStatut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HistoriqueStatutRepository extends JpaRepository<HistoriqueStatut, Integer> {
    List<HistoriqueStatut> findBySignalementIdOrderByDateModificationDesc(Integer signalementId);
}