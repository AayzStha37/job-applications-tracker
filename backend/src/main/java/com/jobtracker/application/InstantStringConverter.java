package com.jobtracker.application;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Stores Instant as "yyyy-MM-dd HH:mm:ss.SSS" TEXT in SQLite,
 * which the SQLite JDBC driver can parse back without error.
 */
@Converter(autoApply = false)
public class InstantStringConverter implements AttributeConverter<Instant, String> {

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    @Override
    public String convertToDatabaseColumn(Instant instant) {
        if (instant == null) return null;
        return FMT.format(LocalDateTime.ofInstant(instant, ZoneOffset.UTC));
    }

    @Override
    public Instant convertToEntityAttribute(String dbValue) {
        if (dbValue == null || dbValue.isBlank()) return null;
        // Handle epoch millis from legacy data
        if (dbValue.matches("\\d+")) {
            return Instant.ofEpochMilli(Long.parseLong(dbValue));
        }
        return LocalDateTime.parse(dbValue, FMT).toInstant(ZoneOffset.UTC);
    }
}
