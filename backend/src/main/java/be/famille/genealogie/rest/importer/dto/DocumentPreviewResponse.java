package be.famille.genealogie.rest.importer.dto;

import java.util.List;

public record DocumentPreviewResponse(String fileName, int lineCount, List<String> lines, List<ImportCandidateResponse> candidates) {}
