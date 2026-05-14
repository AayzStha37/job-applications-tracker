package com.jobtracker.application;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface StatusHistoryRepository extends JpaRepository<StatusHistoryEntity, Long> {

    List<StatusHistoryEntity> findByApplicationIdOrderByChangedAtAsc(Long applicationId);

    @Query("""
            SELECT DISTINCT a.company, a.position
            FROM StatusHistoryEntity h
            JOIN ApplicationEntity a ON h.applicationId = a.id
            WHERE h.toStatus = :status
            ORDER BY a.company, a.position
            """)
    List<Object[]> findCompanyRolesByToStatus(Status status);
}
