package com.jobtracker.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ApplicationService {

    private final ApplicationRepository repository;
    private final TailorQueueService tailorQueue;

    public ApplicationService(ApplicationRepository repository, TailorQueueService tailorQueue) {
        this.repository = repository;
        this.tailorQueue = tailorQueue;
    }

    public record UpsertResult(ApplicationEntity entity, boolean created) {}

    @Transactional
    public UpsertResult upsert(ApplicationDtos.CreateRequest req) {
        if (req.externalJobId() != null && !req.externalJobId().isBlank()) {
            Optional<ApplicationEntity> existing =
                    repository.findBySourceAndExternalJobId(req.source(), req.externalJobId());
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
        entity.setJobDescription(req.jobDescription());
        entity.setLocCode(req.locCode());
        entity.setMailAlias(req.mailAlias() == null || req.mailAlias().isBlank() ? "email1" : req.mailAlias());
        entity.setStatus(Status.SAVED);
        ApplicationEntity saved = repository.save(entity);
        // saved.getId() is now set; flush to inbox
        TailorQueueService.Outcome outcome = tailorQueue.enqueue(saved);
        saved.setTailorStatus(outcome.status());
        if (outcome.error() != null) saved.setTailorError(outcome.error());
        return new UpsertResult(saved, true);
    }

    @Transactional(readOnly = true)
    public List<ApplicationEntity> list() {
        return repository.findAllByOrderByUpdatedAtDesc();
    }

    @Transactional
    public Optional<ApplicationEntity> update(Long id, ApplicationDtos.UpdateRequest req) {
        return repository.findById(id).map(e -> {
            if (req.status() != null) e.setStatus(req.status());
            if (req.notes() != null) e.setNotes(req.notes());
            return e;
        });
    }

    @Transactional
    public Optional<ApplicationEntity> updateTailorStatus(Long id, ApplicationDtos.TailorStatusUpdate req) {
        return repository.findById(id).map(e -> {
            if (req.status() != null) e.setTailorStatus(req.status());
            if (req.tailoredCvPath() != null) e.setTailoredCvPath(req.tailoredCvPath());
            // null `error` is allowed to clear it on success transition; treat empty string the same way
            e.setTailorError(req.error() == null || req.error().isBlank() ? null : req.error());
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
