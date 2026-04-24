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
    public ResponseEntity<ApplicationDtos.Response> update(
            @PathVariable Long id,
            @RequestBody ApplicationDtos.UpdateRequest req
    ) {
        return service.update(id, req)
                .map(ApplicationDtos.Response::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return service.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
