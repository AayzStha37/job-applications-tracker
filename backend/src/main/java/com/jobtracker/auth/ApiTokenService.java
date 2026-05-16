package com.jobtracker.auth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
public class ApiTokenService {

    public static final String TOKEN_PREFIX = "pat_";

    private final ApiTokenRepository repository;
    private final SecureRandom random = new SecureRandom();

    public ApiTokenService(ApiTokenRepository repository) {
        this.repository = repository;
    }

    public record MintResult(ApiToken token, String plaintext) {}

    @Transactional
    public MintResult mint(String name) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String plaintext = TOKEN_PREFIX + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        ApiToken token = new ApiToken();
        token.setName(name);
        token.setTokenHash(hash(plaintext));
        repository.save(token);
        return new MintResult(token, plaintext);
    }

    public List<ApiToken> list() {
        return repository.findAll();
    }

    @Transactional
    public boolean revoke(Long id) {
        return repository.findById(id)
                .filter(t -> t.getRevokedAt() == null)
                .map(t -> {
                    t.setRevokedAt(Instant.now());
                    repository.save(t);
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    public Optional<ApiToken> findActiveByPlaintext(String plaintext) {
        if (plaintext == null || !plaintext.startsWith(TOKEN_PREFIX)) return Optional.empty();
        Optional<ApiToken> found = repository.findByTokenHash(hash(plaintext));
        found.ifPresent(t -> {
            if (t.getRevokedAt() == null) {
                t.setLastUsedAt(Instant.now());
                repository.save(t);
            }
        });
        return found.filter(t -> t.getRevokedAt() == null);
    }

    public static String hash(String plaintext) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(plaintext.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
