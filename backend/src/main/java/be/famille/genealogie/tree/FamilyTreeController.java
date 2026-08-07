package be.famille.genealogie.tree;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController @RequestMapping("/api/trees") @CrossOrigin(origins="http://localhost:4200")
public class FamilyTreeController {
    private final FamilyTreeRepository repository;
    public FamilyTreeController(FamilyTreeRepository repository){this.repository=repository;}
    @GetMapping public List<FamilyTree> all(){return repository.findAll();}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public FamilyTree create(@RequestBody FamilyTree tree){
        if(tree.getName()==null||tree.getName().isBlank())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Le nom est obligatoire");
        tree.setId(null); tree.setCreatedAt(java.time.LocalDateTime.now()); return repository.save(tree);
    }
}
