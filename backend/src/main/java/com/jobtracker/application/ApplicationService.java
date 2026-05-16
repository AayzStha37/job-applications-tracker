package com.jobtracker.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class ApplicationService {

    private final ApplicationRepository repository;
    private final StatusHistoryRepository historyRepository;

    public ApplicationService(ApplicationRepository repository,
                              StatusHistoryRepository historyRepository) {
        this.repository = repository;
        this.historyRepository = historyRepository;
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

        // Record creation history (null → initial status)
        historyRepository.save(new StatusHistoryEntity(
                saved.getId(), null, saved.getStatus(), saved.getCreatedAt() != null ? saved.getCreatedAt() : Instant.now()
        ));

        return new UpsertResult(saved, true);
    }

    @Transactional
    public List<ApplicationEntity> list() {
        List<ApplicationEntity> all = repository.findAllByOrderByCreatedAtDesc();
        Instant threshold = Instant.now().minus(30, ChronoUnit.DAYS);

        for (ApplicationEntity e : all) {
            if (e.getStatus() == Status.APPLIED) {
                Instant changedAt = e.getStatusChangedAt() != null ? e.getStatusChangedAt() : e.getCreatedAt();
                if (changedAt != null && changedAt.isBefore(threshold)) {
                    Status previous = e.getStatus();
                    e.setStatus(Status.GHOSTED);
                    e.setStatusChangedAt(Instant.now());
                    repository.save(e);
                    historyRepository.save(new StatusHistoryEntity(
                            e.getId(), previous, Status.GHOSTED, e.getStatusChangedAt()
                    ));
                }
            }
        }

        return repository.findAllByOrderByCreatedAtDesc();
    }

    /** Valid forward transitions per status. Backward moves are still allowed (human error correction). */
    private static final Map<Status, Set<Status>> VALID_TRANSITIONS = Map.of(
            Status.SAVED, Set.of(Status.APPLIED),
            Status.APPLIED, Set.of(Status.SCREEN, Status.REJECTED),
            Status.GHOSTED, Set.of(Status.SCREEN, Status.REJECTED),
            Status.SCREEN, Set.of(Status.INTERVIEW, Status.REJECTED),
            Status.INTERVIEW, Set.of(Status.OFFER, Status.REJECTED),
            Status.OFFER, Set.of(Status.REJECTED),
            Status.REJECTED, Set.of()
    );

    @Transactional
    public Optional<ApplicationEntity> update(Long id, ApplicationDtos.UpdateRequest req) {
        return repository.findById(id).map(e -> {
            if (req.status() != null && req.status() != e.getStatus()) {
                Status from = e.getStatus();
                Status to = req.status();

                // Block invalid forward moves (backward moves allowed for error correction)
                boolean isForward = PIPELINE_ORDER.getOrDefault(to, 50) > PIPELINE_ORDER.getOrDefault(from, 50);
                if (isForward && !VALID_TRANSITIONS.getOrDefault(from, Set.of()).contains(to)) {
                    throw new IllegalArgumentException(
                            "Invalid transition: " + from + " → " + to);
                }

                e.setStatus(to);
                Instant now = Instant.now();
                e.setStatusChangedAt(now);
                historyRepository.save(new StatusHistoryEntity(e.getId(), from, to, now));
            }
            if (req.notes() != null) e.setNotes(req.notes());
            if (req.company() != null) e.setCompany(req.company());
            if (req.position() != null) e.setPosition(req.position());
            if (req.location() != null) e.setLocation(req.location());
            if (req.url() != null) e.setUrl(req.url());
            if (req.source() != null) e.setSource(req.source());
            if (req.externalJobId() != null) e.setExternalJobId(req.externalJobId());
            if (req.updatedAt() != null) e.setUpdatedAt(req.updatedAt());
            return e;
        });
    }

    @Transactional
    public boolean delete(Long id) {
        if (!repository.existsById(id)) return false;
        repository.deleteById(id);
        return true;
    }

    @Transactional(readOnly = true)
    public List<StatusHistoryEntity> getHistory(Long applicationId) {
        return historyRepository.findByApplicationIdOrderByChangedAtAsc(applicationId);
    }

    /**
     * Pipeline order for the Sankey diagram. REJECTED is handled specially
     * as a terminal state reachable from any stage, not as part of the
     * forward progression. ACTIVE is a virtual sink for currently-in-flight apps.
     */
    private static final Map<Status, Integer> PIPELINE_ORDER = Map.of(
            Status.SAVED, 0,
            Status.APPLIED, 1,
            Status.GHOSTED, 2,
            Status.SCREEN, 3,
            Status.INTERVIEW, 4,
            Status.OFFER, 5,
            Status.REJECTED, 99   // sentinel — always last
    );

    /** Stages where an app is still "in-flight" (waiting for a response). */
    private static final java.util.Set<Status> IN_FLIGHT = Set.of(
            Status.APPLIED, Status.SCREEN, Status.INTERVIEW, Status.OFFER
    );

    /**
     * Builds deduplicated Sankey transition data, current-state aware.
     *
     * For each non-SAVED application we derive an "effective pipeline path"
     * anchored to its CURRENT state so that backward moves in the Kanban
     * (e.g. OFFER → SCREEN to undo a misclick) cause the diagram to revert,
     * rather than preserving the app's all-time peak stage.
     *
     * Per app:
     *   1. Start with effectiveStages = {APPLIED, current_status}.
     *   2. Add each history record's to_status only if the record is a forward
     *      transition (toOrder > fromOrder) AND toOrder ≤ currentOrder.
     *      This prunes stages the app has since reverted past.
     *   3. Sort stages by pipeline order; REJECTED (order 99) naturally lands
     *      last when it is the current state, and is filtered out otherwise.
     *   4. Emit +1 for each consecutive pair in the sorted path.
     *   5. If currently in-flight (APPLIED / SCREEN / INTERVIEW / OFFER),
     *      emit a virtual current → ACTIVE link.
     *
     * Each application contributes at most one count per transition pair,
     * regardless of how many times it bounced back and forth.
     */
    @Transactional(readOnly = true)
    public List<ApplicationDtos.TransitionResponse> getTransitions() {
        List<StatusHistoryEntity> allHistory = historyRepository.findAll();

        // Group raw history by app id; we need from_status too to detect forward records.
        Map<Long, List<StatusHistoryEntity>> historyByApp = new HashMap<>();
        for (StatusHistoryEntity h : allHistory) {
            historyByApp.computeIfAbsent(h.getApplicationId(), k -> new ArrayList<>()).add(h);
        }

        Map<String, Long> transitionCounts = new HashMap<>();

        for (ApplicationEntity app : repository.findAll()) {
            Status current = app.getStatus();
            if (current == null || current == Status.SAVED) continue;

            int currentOrder = PIPELINE_ORDER.getOrDefault(current, 50);

            // APPLIED is the canonical entry point; current is always present in the path.
            Set<Status> effective = new LinkedHashSet<>();
            effective.add(Status.APPLIED);
            effective.add(current);

            // Add forward stages from history that are at-or-before the current pipeline order.
            for (StatusHistoryEntity h : historyByApp.getOrDefault(app.getId(), List.of())) {
                Status to = h.getToStatus();
                if (to == null || to == Status.SAVED) continue;
                int toOrder = PIPELINE_ORDER.getOrDefault(to, 50);
                int fromOrder = h.getFromStatus() == null
                        ? -1
                        : PIPELINE_ORDER.getOrDefault(h.getFromStatus(), 50);
                if (toOrder > fromOrder && toOrder <= currentOrder) {
                    effective.add(to);
                }
            }

            // Sort by pipeline order and emit consecutive pairs.
            List<Status> sorted = new ArrayList<>(effective);
            sorted.sort(Comparator.comparingInt(s -> PIPELINE_ORDER.getOrDefault(s, 50)));
            for (int i = 0; i < sorted.size() - 1; i++) {
                String key = sorted.get(i).name() + "->" + sorted.get(i + 1).name();
                transitionCounts.merge(key, 1L, Long::sum);
            }

            // Virtual ACTIVE sink for in-flight apps (so they appear at their current node).
            if (IN_FLIGHT.contains(current)) {
                transitionCounts.merge(current.name() + "->ACTIVE", 1L, Long::sum);
            }
        }

        return transitionCounts.entrySet().stream()
                .map(e -> {
                    String[] parts = e.getKey().split("->");
                    return new ApplicationDtos.TransitionResponse(parts[0], parts[1], e.getValue());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> getCompaniesForStatus(Status status) {
        return historyRepository.findCompanyRolesByToStatus(status).stream()
                .map(row -> row[0].toString() + " - " + row[1].toString())
                .toList();
    }
}
