package com.jobtracker.application;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/applications")
public class ApplicationController {

    private final ApplicationService service;

    public ApplicationController(ApplicationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ApplicationDtos.Response> create(@Valid @RequestBody ApplicationDtos.CreateRequest req) {
        ApplicationService.UpsertResult result = service.upsert(req);
        HttpStatus code = result.created() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(code).body(ApplicationDtos.Response.from(result.entity()));
    }

    @GetMapping
    public List<ApplicationDtos.Response> list() {
        return service.list().stream().map(ApplicationDtos.Response::from).toList();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody ApplicationDtos.UpdateRequest req
    ) {
        try {
            return service.update(id, req)
                    .map(ApplicationDtos.Response::from)
                    .map(r -> ResponseEntity.ok((Object) r))
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return service.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @GetMapping("/transitions")
    public List<ApplicationDtos.TransitionResponse> transitions() {
        return service.getTransitions();
    }

    @GetMapping("/transitions/{status}")
    public ApplicationDtos.CompaniesResponse companiesForStatus(@PathVariable Status status) {
        List<String> companies = service.getCompaniesForStatus(status);
        return new ApplicationDtos.CompaniesResponse(status.name(), companies);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<ApplicationDtos.StatusHistoryResponse>> history(@PathVariable Long id) {
        List<ApplicationDtos.StatusHistoryResponse> hist = service.getHistory(id)
                .stream()
                .map(ApplicationDtos.StatusHistoryResponse::from)
                .toList();
        if (hist.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(hist);
    }
}
