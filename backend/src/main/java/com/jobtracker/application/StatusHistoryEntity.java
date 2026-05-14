package com.jobtracker.application;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "status_history")
public class StatusHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_id", nullable = false)
    private Long applicationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status")
    private Status fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false)
    private Status toStatus;

    @Convert(converter = InstantStringConverter.class)
    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    public StatusHistoryEntity() {}

    public StatusHistoryEntity(Long applicationId, Status fromStatus, Status toStatus, Instant changedAt) {
        this.applicationId = applicationId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.changedAt = changedAt;
    }

    public Long getId() { return id; }
    public Long getApplicationId() { return applicationId; }
    public Status getFromStatus() { return fromStatus; }
    public Status getToStatus() { return toStatus; }
    public Instant getChangedAt() { return changedAt; }
}
