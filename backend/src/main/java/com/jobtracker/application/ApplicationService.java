package com.jobtracker.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class ApplicationService {

    private final ApplicationRepository repository;

    public ApplicationService(ApplicationRepository repository) {
        this.repository = repository;
    }

    public record UpsertResult(ApplicationEntity entity, boolean created) {}

    @Transactional
    public UpsertResult upsert(ApplicationDtos.CreateRequest req) {
        // Dedup by (source, externalJobId) when job ID is present
        if (req.externalJobId() != null && !req.externalJobId().isBlank()) {
            Optional<ApplicationEntity> existing =
                    repository.findBySourceAndExternalJobId(req.source(), req.externalJobId());
            if (existing.isPresent()) {
                return new UpsertResult(existing.get(), false);
            }
        } else {
            // No job ID — dedup by URL to avoid unique constraint violation
            Optional<ApplicationEntity> existing = repository.findByUrl(req.url());
            if (existing.isPresent()) {
                return new UpsertResult(existing.get(), false);
            }
        }

        ApplicationEntity entity = new ApplicationEntity();
        entity.setCompany(req.company());
        entity.setPosition(req.position());
        entity.setLocation(req.location());
        entity.setUrl(req.url());
        entity.setSource(req.source());
        entity.setExternalJobId(req.externalJobId());
        entity.setNotes(req.notes());
        entity.setStatus(Status.SAVED);
        ApplicationEntity saved = repository.save(entity);
        return new UpsertResult(saved, true);
    }

    @Transactional(readOnly = true)
    public List<ApplicationEntity> list() {
        return repository.findAllByOrderByUpdatedAtDesc();
    }

    @Transactional
    public Optional<ApplicationEntity> update(Long id, ApplicationDtos.UpdateRequest req) {
        return repository.findById(id).map(e -> {
            if (req.status() != null && req.status() != e.getStatus()) {
                e.setStatus(req.status());
                e.setStatusChangedAt(Instant.now());
            }
            if (req.notes() != null) e.setNotes(req.notes());
            return e;
        });
    }

    @Transactional
    public boolean delete(Long id) {
        if (!repository.existsById(id)) return false;
        repository.deleteById(id);
        return true;
    }
}
