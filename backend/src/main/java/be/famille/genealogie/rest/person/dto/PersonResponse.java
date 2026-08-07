package be.famille.genealogie.rest.person.dto;

import be.famille.genealogie.domain.enumeration.Gender;
import java.time.LocalDate;

public record PersonResponse(
    Long id, String firstName, String lastName, LocalDate birthDate, LocalDate deathDate,
    String birthPlace, String photoUrl, Gender gender, String notes, Long fatherId,
    Long motherId, Long spouseId, Long parentId, String sourceReference, Long treeId
) {}
