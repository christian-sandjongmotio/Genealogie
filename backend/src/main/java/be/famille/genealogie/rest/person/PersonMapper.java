package be.famille.genealogie.rest.person;

import be.famille.genealogie.domain.entity.Person;
import be.famille.genealogie.domain.enumeration.Gender;
import be.famille.genealogie.rest.person.dto.PersonRequest;
import be.famille.genealogie.rest.person.dto.PersonResponse;
import org.springframework.stereotype.Component;

@Component
public class PersonMapper {
    public Person toEntity(PersonRequest request) {
        Person person = new Person();
        person.setFirstName(request.firstName().trim());
        person.setLastName(request.lastName().trim());
        person.setBirthDate(request.birthDate()); person.setDeathDate(request.deathDate());
        person.setBirthPlace(request.birthPlace()); person.setPhotoUrl(request.photoUrl());
        person.setGender(request.gender() == null ? Gender.UNKNOWN : request.gender());
        person.setNotes(request.notes()); person.setFatherId(request.fatherId());
        person.setMotherId(request.motherId()); person.setSpouseId(request.spouseId());
        person.setParentId(request.parentId()); person.setSourceReference(request.sourceReference());
        person.setTreeId(request.treeId());
        return person;
    }

    public PersonResponse toResponse(Person person) {
        return new PersonResponse(person.getId(), person.getFirstName(), person.getLastName(),
            person.getBirthDate(), person.getDeathDate(), person.getBirthPlace(), person.getPhotoUrl(),
            person.getGender(), person.getNotes(), person.getFatherId(), person.getMotherId(),
            person.getSpouseId(), person.getParentId(), person.getSourceReference(), person.getTreeId());
    }
}
