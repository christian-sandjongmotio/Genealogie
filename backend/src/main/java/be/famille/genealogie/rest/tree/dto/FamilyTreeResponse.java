package be.famille.genealogie.rest.tree.dto;

import java.time.LocalDateTime;

public record FamilyTreeResponse(Long id, String name, String description, LocalDateTime createdAt) {}
