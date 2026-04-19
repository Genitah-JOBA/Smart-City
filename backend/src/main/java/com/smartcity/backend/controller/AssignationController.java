// AssignationController.java
package com.smartcity.backend.controller;

import com.smartcity.backend.model.Assignation;
import com.smartcity.backend.repository.AssignationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/assignations")
@CrossOrigin(origins = "http://localhost:5173")
public class AssignationController {

    @Autowired
    private AssignationRepository assignationRepository;

    @GetMapping("/agent/{agentId}")
    public ResponseEntity<?> getAssignationsByAgent(@PathVariable Integer agentId) {
        try {
            List<Assignation> assignations = assignationRepository.findByAgentId(agentId);
            return ResponseEntity.ok(assignations);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }
    
    @GetMapping
    public ResponseEntity<?> getAllAssignations() {
        try {
            List<Assignation> assignations = assignationRepository.findAll();
            return ResponseEntity.ok(assignations);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createAssignation(@RequestBody Map<String, Object> body) {
        try {
            Assignation assignation = new Assignation();
            assignation.setSignalementId((Integer) body.get("signalement_id"));
            assignation.setAgentId((Integer) body.get("agent_id"));
            assignation.setDateAssignation(LocalDateTime.now());
            
            Assignation saved = assignationRepository.save(assignation);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }
}