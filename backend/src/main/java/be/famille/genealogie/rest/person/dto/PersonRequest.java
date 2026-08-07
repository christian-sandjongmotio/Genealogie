package be.famille.genealogie.rest.person.dto;

import be.famille.genealogie.domain.enumeration.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record PersonRequest(
    @NotBlank String firstName,
    @NotBlank String lastName,
    LocalDate birthDate,
    LocalDate deathDate,
    String birthPlace,
    String photoUrl,
    Gender gender,
    String notes,
    Long fatherId,
    Long motherId,
    Long spouseId,
    Long parentId,
    String sourceReference,
    @NotNull Long treeId
) {}
