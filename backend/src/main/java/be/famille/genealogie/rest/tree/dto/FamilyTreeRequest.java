package be.famille.genealogie.rest.tree.dto;

import jakarta.validation.constraints.NotBlank;

public record FamilyTreeRequest(@NotBlank String name, String description) {}
