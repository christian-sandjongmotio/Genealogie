package be.famille.genealogie.rest.importer;

import be.famille.genealogie.rest.importer.dto.*;
import be.famille.genealogie.service.DocumentImportService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/import")
public class DocumentImportController {
    private final DocumentImportService service;
    public DocumentImportController(DocumentImportService service) { this.service = service; }

    @GetMapping("/document-preview")
    public DocumentPreviewResponse preview() {
        var preview = service.preview();
        return new DocumentPreviewResponse(preview.fileName(), preview.lineCount(), preview.lines(),
            preview.candidates().stream().map(candidate -> new ImportCandidateResponse(candidate.reference(), candidate.name(), candidate.parentReference())).toList());
    }

    @PostMapping("/document-apply")
    public ImportResultResponse apply() {
        var result = service.apply();
        return new ImportResultResponse(result.imported(), result.linked());
    }
}
