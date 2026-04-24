package com.jobtracker.application;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<ApplicationEntity, Long> {

    List<ApplicationEntity> findAllByOrderByUpdatedAtDesc();

    Optional<ApplicationEntity> findBySourceAndExternalJobId(String source, String externalJobId);
}
