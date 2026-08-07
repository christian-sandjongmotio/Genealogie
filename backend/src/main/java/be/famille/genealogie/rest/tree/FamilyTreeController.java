package be.famille.genealogie.rest.tree;

import be.famille.genealogie.domain.entity.FamilyTree;
import be.famille.genealogie.rest.tree.dto.*;
import be.famille.genealogie.service.FamilyTreeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/trees")
@CrossOrigin(origins = "http://localhost:4200")
public class FamilyTreeController {
    private final FamilyTreeService service;
    public FamilyTreeController(FamilyTreeService service) { this.service = service; }

    @GetMapping public List<FamilyTreeResponse> findAll() { return service.findAll().stream().map(this::toResponse).toList(); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public FamilyTreeResponse create(@Valid @RequestBody FamilyTreeRequest request) {
        return toResponse(service.create(request.name(), request.description()));
    }
    private FamilyTreeResponse toResponse(FamilyTree tree) {
        return new FamilyTreeResponse(tree.getId(), tree.getName(), tree.getDescription(), tree.getCreatedAt());
    }
}
