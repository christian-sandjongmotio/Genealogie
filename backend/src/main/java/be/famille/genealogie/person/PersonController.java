package be.famille.genealogie.person;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/persons")
@CrossOrigin(origins = "http://localhost:4200")
public class PersonController {
    private final PersonRepository repository;
    public PersonController(PersonRepository repository) { this.repository = repository; }
    @GetMapping public List<Person> all(@RequestParam(required=false) Long treeId) { return treeId == null ? repository.findAll() : repository.findByTreeIdOrderById(treeId); }
    @GetMapping("/{id}") public Person one(@PathVariable Long id) { return find(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public Person create(@Valid @RequestBody Person person) { person.setId(null); validate(person); validateRelations(person); return repository.save(person); }
    @PutMapping("/{id}") public Person update(@PathVariable Long id, @Valid @RequestBody Person person) { find(id); person.setId(id); validate(person); validateRelations(person); return repository.save(person); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable Long id) {
        Person person = find(id);
        repository.findAll().stream().filter(p -> id.equals(p.getFatherId()) || id.equals(p.getMotherId()) || id.equals(p.getSpouseId()) || id.equals(p.getParentId())).forEach(p -> {
            if (id.equals(p.getFatherId())) p.setFatherId(null);
            if (id.equals(p.getMotherId())) p.setMotherId(null);
            if (id.equals(p.getSpouseId())) p.setSpouseId(null);
            if (id.equals(p.getParentId())) p.setParentId(null);
            repository.save(p);
        });
        repository.delete(person);
    }
    @GetMapping(value="/export/gedcom", produces="text/plain;charset=UTF-8")
    public ResponseEntity<byte[]> gedcom() {
        StringBuilder ged = new StringBuilder("0 HEAD\n1 SOUR MEMOIRE_FAMILIALE\n1 CHAR UTF-8\n");
        for (Person p : repository.findAll()) {
            ged.append("0 @I").append(p.getId()).append("@ INDI\n1 NAME ").append(p.getFirstName()).append(" /").append(p.getLastName()).append("/\n");
            if (p.getBirthDate() != null) ged.append("1 BIRT\n2 DATE ").append(p.getBirthDate()).append("\n");
            if (p.getBirthPlace() != null) ged.append("2 PLAC ").append(p.getBirthPlace()).append("\n");
            if (p.getDeathDate() != null) ged.append("1 DEAT\n2 DATE ").append(p.getDeathDate()).append("\n");
            if (p.getFatherId() != null) ged.append("1 _FATHER @I").append(p.getFatherId()).append("@\n");
            if (p.getMotherId() != null) ged.append("1 _MOTHER @I").append(p.getMotherId()).append("@\n");
        }
        ged.append("0 TRLR\n");
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=arbre-familial.ged").contentType(MediaType.TEXT_PLAIN).body(ged.toString().getBytes(StandardCharsets.UTF_8));
    }
    private void validate(Person person) {
        if (person.getId() != null && (person.getId().equals(person.getFatherId()) || person.getId().equals(person.getMotherId()) || person.getId().equals(person.getSpouseId()))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Une personne ne peut pas être sa propre relation");
        for (Long relation : java.util.stream.Stream.of(person.getFatherId(), person.getMotherId(), person.getSpouseId(), person.getParentId()).filter(java.util.Objects::nonNull).toList()) if (!repository.existsById(relation)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Relation familiale introuvable");
    }
    private void validateRelations(Person person) {
        if (person.getFatherId() != null && person.getFatherId().equals(person.getMotherId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le pere et la mere doivent etre differents");
        for (Long relationId : java.util.stream.Stream.of(person.getFatherId(), person.getMotherId(), person.getSpouseId(), person.getParentId()).filter(java.util.Objects::nonNull).toList()) {
            Person related = find(relationId);
            if (!java.util.Objects.equals(person.getTreeId(), related.getTreeId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Les relations doivent appartenir au meme arbre");
        }
        if (person.getFatherId() != null && "FEMALE".equals(find(person.getFatherId()).getGender())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La personne choisie comme pere est renseignee comme femme");
        if (person.getMotherId() != null && "MALE".equals(find(person.getMotherId()).getGender())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La personne choisie comme mere est renseignee comme homme");
    }
    private Person find(Long id) { return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Personne introuvable")); }
}
