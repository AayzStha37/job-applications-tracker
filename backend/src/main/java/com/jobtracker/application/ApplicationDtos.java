package com.jobtracker.application;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class ApplicationDtos {

    public record CreateRequest(
            @NotBlank String company,
            @NotBlank String position,
            String location,
            @NotBlank String url,
            @NotBlank String source,
            String externalJobId,
            String notes
    ) {}

    public record UpdateRequest(
            Status status,
            String notes
    ) {}

    public record Response(
            Long id,
            String company,
            String position,
            String location,
            String url,
            String source,
            String externalJobId,
            Status status,
            String notes,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static Response from(ApplicationEntity e) {
            return new Response(
                    e.getId(),
                    e.getCompany(),
                    e.getPosition(),
                    e.getLocation(),
                    e.getUrl(),
                    e.getSource(),
                    e.getExternalJobId(),
                    e.getStatus(),
                    e.getNotes(),
                    e.getCreatedAt(),
                    e.getUpdatedAt()
            );
        }
    }
}
