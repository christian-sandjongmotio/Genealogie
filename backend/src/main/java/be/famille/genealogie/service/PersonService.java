package be.famille.genealogie.service;

import be.famille.genealogie.domain.entity.Person;
import be.famille.genealogie.domain.enumeration.Gender;
import be.famille.genealogie.domain.repository.PersonRepository;
import be.famille.genealogie.service.exception.BusinessException;
import be.famille.genealogie.service.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

@Service
@Transactional(readOnly = true)
public class PersonService {
    private final PersonRepository repository;

    public PersonService(PersonRepository repository) { this.repository = repository; }

    public List<Person> findAll(Long treeId) {
        return treeId == null ? repository.findAll() : repository.findByTreeIdOrderById(treeId);
    }

    public Person findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Personne introuvable"));
    }

    @Transactional
    public Person create(Person person) {
        person.setId(null);
        validate(person);
        return repository.save(person);
    }

    @Transactional
    public Person update(Long id, Person values) {
        findById(id);
        values.setId(id);
        validate(values);
        return repository.save(values);
    }

    @Transactional
    public void delete(Long id) {
        Person person = findById(id);
        repository.findAll().stream()
            .filter(candidate -> references(candidate, id))
            .forEach(candidate -> {
                if (id.equals(candidate.getFatherId())) candidate.setFatherId(null);
                if (id.equals(candidate.getMotherId())) candidate.setMotherId(null);
                if (id.equals(candidate.getSpouseId())) candidate.setSpouseId(null);
                if (id.equals(candidate.getParentId())) candidate.setParentId(null);
            });
        repository.delete(person);
    }

    public String exportGedcom() {
        StringBuilder gedcom = new StringBuilder("0 HEAD\n1 SOUR MEMOIRE_FAMILIALE\n1 CHAR UTF-8\n");
        for (Person person : repository.findAll()) {
            gedcom.append("0 @I").append(person.getId()).append("@ INDI\n1 NAME ")
                .append(person.getFirstName()).append(" /").append(person.getLastName()).append("/\n");
            if (person.getBirthDate() != null) gedcom.append("1 BIRT\n2 DATE ").append(person.getBirthDate()).append('\n');
            if (person.getBirthPlace() != null) gedcom.append("2 PLAC ").append(person.getBirthPlace()).append('\n');
            if (person.getDeathDate() != null) gedcom.append("1 DEAT\n2 DATE ").append(person.getDeathDate()).append('\n');
            if (person.getFatherId() != null) gedcom.append("1 _FATHER @I").append(person.getFatherId()).append("@\n");
            if (person.getMotherId() != null) gedcom.append("1 _MOTHER @I").append(person.getMotherId()).append("@\n");
        }
        return gedcom.append("0 TRLR\n").toString();
    }

    private void validate(Person person) {
        if (person.getTreeId() == null) throw new BusinessException("L'arbre familial est obligatoire");
        if (person.getId() != null && Stream.of(person.getFatherId(), person.getMotherId(), person.getSpouseId(), person.getParentId()).anyMatch(person.getId()::equals))
            throw new BusinessException("Une personne ne peut pas etre sa propre relation");
        if (person.getFatherId() != null && person.getFatherId().equals(person.getMotherId()))
            throw new BusinessException("Le pere et la mere doivent etre differents");
        for (Long relationId : relationIds(person)) {
            Person related = findById(relationId);
            if (!Objects.equals(person.getTreeId(), related.getTreeId()))
                throw new BusinessException("Les relations doivent appartenir au meme arbre");
        }
        if (person.getFatherId() != null && findById(person.getFatherId()).getGender() == Gender.FEMALE)
            throw new BusinessException("La personne choisie comme pere est renseignee comme femme");
        if (person.getMotherId() != null && findById(person.getMotherId()).getGender() == Gender.MALE)
            throw new BusinessException("La personne choisie comme mere est renseignee comme homme");
    }

    private List<Long> relationIds(Person person) {
        return Stream.of(person.getFatherId(), person.getMotherId(), person.getSpouseId(), person.getParentId())
            .filter(Objects::nonNull).toList();
    }

    private boolean references(Person person, Long id) {
        return id.equals(person.getFatherId()) || id.equals(person.getMotherId())
            || id.equals(person.getSpouseId()) || id.equals(person.getParentId());
    }
}
