package com.jobtracker.config;

import com.jobtracker.auth.ApiTokenService;
import com.jobtracker.auth.PatAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final ApiTokenService tokenService;
    private final String devToken;
    private final String jwtIssuerUri;

    public SecurityConfig(
            ApiTokenService tokenService,
            @Value("${app.dev-token:}") String devToken,
            @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri:}") String jwtIssuerUri) {
        this.tokenService = tokenService;
        this.devToken = devToken;
        this.jwtIssuerUri = jwtIssuerUri;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(c -> {})
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/healthz").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(new PatAuthenticationFilter(tokenService, devToken),
                        UsernamePasswordAuthenticationFilter.class);

        if (jwtIssuerUri != null && !jwtIssuerUri.isBlank()) {
            http.oauth2ResourceServer(oauth -> oauth.jwt(jwt -> {}));
        }

        return http.build();
    }
}
