package com.jobtracker.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class PatAuthenticationFilter extends OncePerRequestFilter {

    private final ApiTokenService tokenService;
    private final String devToken;

    public PatAuthenticationFilter(ApiTokenService tokenService, String devToken) {
        this.tokenService = tokenService;
        this.devToken = devToken == null ? "" : devToken;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        if (!devToken.isBlank()) {
            String header = request.getHeader("X-Dev-Token");
            if (devToken.equals(header)) {
                authenticate("dev");
                chain.doFilter(request, response);
                return;
            }
        }

        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer " + ApiTokenService.TOKEN_PREFIX)) {
            String token = auth.substring("Bearer ".length());
            tokenService.findActiveByPlaintext(token)
                    .ifPresent(t -> authenticate("pat:" + t.getId()));
        }

        chain.doFilter(request, response);
    }

    private void authenticate(String principal) {
        var authentication = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
