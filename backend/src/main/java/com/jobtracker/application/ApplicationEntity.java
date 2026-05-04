package com.jobtracker.application;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "applications")
public class ApplicationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String position;

    private String location;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private String source;

    @Column(name = "external_job_id")
    private String externalJobId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.APPLIED;

    private String notes;

    @Column(name = "job_description")
    private String jobDescription;

    @Column(name = "loc_code")
    private String locCode;

    @Column(name = "mail_alias", nullable = false)
    private String mailAlias = "email1";

    @Enumerated(EnumType.STRING)
    @Column(name = "tailor_status", nullable = false)
    private TailorStatus tailorStatus = TailorStatus.PENDING;

    @Column(name = "tailored_cv_path")
    private String tailoredCvPath;

    @Column(name = "tailor_error")
    private String tailorError;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (status == null) status = Status.APPLIED;
        if (mailAlias == null) mailAlias = "email1";
        if (tailorStatus == null) tailorStatus = TailorStatus.PENDING;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getExternalJobId() { return externalJobId; }
    public void setExternalJobId(String externalJobId) { this.externalJobId = externalJobId; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }
    public String getLocCode() { return locCode; }
    public void setLocCode(String locCode) { this.locCode = locCode; }
    public String getMailAlias() { return mailAlias; }
    public void setMailAlias(String mailAlias) { this.mailAlias = mailAlias; }
    public TailorStatus getTailorStatus() { return tailorStatus; }
    public void setTailorStatus(TailorStatus tailorStatus) { this.tailorStatus = tailorStatus; }
    public String getTailoredCvPath() { return tailoredCvPath; }
    public void setTailoredCvPath(String tailoredCvPath) { this.tailoredCvPath = tailoredCvPath; }
    public String getTailorError() { return tailorError; }
    public void setTailorError(String tailorError) { this.tailorError = tailorError; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
