package com.jobtracker.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;

/**
 * Drops tailored-CV jobs into cv-resume's filesystem inbox so a Claude Code session
 * running /tailor-batch in that repo can drain them. The queue is an unsorted directory
 * of markdown files with YAML frontmatter — see jobs/inbox/&lt;id&gt;__&lt;company&gt;_&lt;role&gt;.md.
 */
@Service
public class TailorQueueService {

    private static final Logger log = LoggerFactory.getLogger(TailorQueueService.class);
    private static final Set<String> VALID_LOC = Set.of("HFX", "TO", "OW", "MO", "VC");
    private static final Set<String> VALID_MAIL = Set.of("email1", "email2");

    private final Path inbox;

    public TailorQueueService(@Value("${cv-resume.path:../cv-resume}") String cvResumePath) {
        this.inbox = Path.of(cvResumePath, "jobs", "inbox").toAbsolutePath().normalize();
    }

    /**
     * Decide whether a freshly-saved application should be tailored, and if so, write
     * its JD into the inbox. Returns the resulting tailor status — caller persists it.
     */
    public Outcome enqueue(ApplicationEntity app) {
        if (app.getJobDescription() == null || app.getJobDescription().isBlank()) {
            return new Outcome(TailorStatus.SKIPPED, null, "no job description scraped");
        }
        String loc = app.getLocCode();
        if (loc == null || !VALID_LOC.contains(loc)) {
            return new Outcome(TailorStatus.SKIPPED, null, "missing or invalid loc_code");
        }
        String mail = app.getMailAlias() == null ? "email1" : app.getMailAlias();
        if (!VALID_MAIL.contains(mail)) {
            return new Outcome(TailorStatus.SKIPPED, null, "invalid mail_alias");
        }

        try {
            Files.createDirectories(inbox);
            String filename = String.format(
                    "%d__%s_%s.md",
                    app.getId(),
                    slug(app.getCompany()),
                    slug(app.getPosition())
            );
            Path target = inbox.resolve(filename);
            Files.writeString(target, render(app, loc, mail), StandardCharsets.UTF_8);
            log.info("queued tailor job at {}", target);
            return new Outcome(TailorStatus.PENDING, target.toString(), null);
        } catch (IOException e) {
            log.warn("failed to write tailor inbox file for application {}: {}", app.getId(), e.getMessage());
            return new Outcome(TailorStatus.FAILED, null, "inbox write failed: " + e.getMessage());
        }
    }

    private static String render(ApplicationEntity app, String loc, String mail) {
        StringBuilder sb = new StringBuilder(app.getJobDescription().length() + 512);
        sb.append("---\n");
        sb.append("id: ").append(app.getId()).append('\n');
        sb.append("company: ").append(yamlString(app.getCompany())).append('\n');
        sb.append("role: ").append(yamlString(app.getPosition())).append('\n');
        if (app.getLocation() != null && !app.getLocation().isBlank()) {
            sb.append("location: ").append(yamlString(app.getLocation())).append('\n');
        }
        sb.append("url: ").append(yamlString(app.getUrl())).append('\n');
        sb.append("loc_code: ").append(loc).append('\n');
        sb.append("mail_alias: ").append(mail).append('\n');
        sb.append("source: ").append(yamlString(app.getSource())).append('\n');
        if (app.getExternalJobId() != null && !app.getExternalJobId().isBlank()) {
            sb.append("external_job_id: ").append(yamlString(app.getExternalJobId())).append('\n');
        }
        sb.append("---\n\n");
        sb.append(app.getJobDescription().trim());
        sb.append('\n');
        return sb.toString();
    }

    /** YAML-safe scalar — wrap in double quotes and escape backslash + double-quote. */
    private static String yamlString(String raw) {
        if (raw == null) return "\"\"";
        return "\"" + raw.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private static String slug(String raw) {
        if (raw == null) return "unknown";
        String s = raw.replaceAll("[^A-Za-z0-9]+", "_").replaceAll("^_+|_+$", "");
        if (s.isEmpty()) return "unknown";
        return s.length() > 60 ? s.substring(0, 60) : s;
    }

    public Path inboxPath() { return inbox; }

    public record Outcome(TailorStatus status, String inboxFilePath, String error) {}
}
