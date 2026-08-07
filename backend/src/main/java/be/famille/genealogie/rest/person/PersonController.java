package be.famille.genealogie.rest.person;

import be.famille.genealogie.rest.person.dto.PersonRequest;
import be.famille.genealogie.rest.person.dto.PersonResponse;
import be.famille.genealogie.service.PersonService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/persons")
@CrossOrigin(origins = "http://localhost:4200")
public class PersonController {
    private final PersonService service;
    private final PersonMapper mapper;

    public PersonController(PersonService service, PersonMapper mapper) { this.service = service; this.mapper = mapper; }

    @GetMapping public List<PersonResponse> findAll(@RequestParam(required = false) Long treeId) {
        return service.findAll(treeId).stream().map(mapper::toResponse).toList();
    }
    @GetMapping("/{id}") public PersonResponse findById(@PathVariable Long id) { return mapper.toResponse(service.findById(id)); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public PersonResponse create(@Valid @RequestBody PersonRequest request) {
        return mapper.toResponse(service.create(mapper.toEntity(request)));
    }
    @PutMapping("/{id}") public PersonResponse update(@PathVariable Long id, @Valid @RequestBody PersonRequest request) {
        return mapper.toResponse(service.update(id, mapper.toEntity(request)));
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable Long id) { service.delete(id); }

    @GetMapping(value = "/export/gedcom", produces = "text/plain;charset=UTF-8")
    public ResponseEntity<byte[]> exportGedcom() {
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=arbre-familial.ged")
            .contentType(MediaType.TEXT_PLAIN)
            .body(service.exportGedcom().getBytes(StandardCharsets.UTF_8));
    }
}
