package com.jobtracker.auth;

import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/auth/tokens")
public class ApiTokenController {

    private final ApiTokenService service;

    public ApiTokenController(ApiTokenService service) {
        this.service = service;
    }

    public record MintRequest(@NotBlank String name) {}
    public record MintResponse(Long id, String name, String token, Instant createdAt) {}
    public record TokenResponse(Long id, String name, Instant createdAt, Instant lastUsedAt, Instant revokedAt) {
        static TokenResponse from(ApiToken t) {
            return new TokenResponse(t.getId(), t.getName(), t.getCreatedAt(), t.getLastUsedAt(), t.getRevokedAt());
        }
    }

    @PostMapping
    public MintResponse mint(@RequestBody MintRequest req) {
        ApiTokenService.MintResult r = service.mint(req.name());
        return new MintResponse(r.token().getId(), r.token().getName(), r.plaintext(), r.token().getCreatedAt());
    }

    @GetMapping
    public List<TokenResponse> list() {
        return service.list().stream().map(TokenResponse::from).toList();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> revoke(@PathVariable Long id) {
        return service.revoke(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
