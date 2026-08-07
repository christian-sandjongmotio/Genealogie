package be.famille.genealogie.service;

import be.famille.genealogie.domain.entity.FamilyTree;
import be.famille.genealogie.domain.repository.FamilyTreeRepository;
import be.famille.genealogie.service.exception.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class FamilyTreeService {
    private final FamilyTreeRepository repository;
    public FamilyTreeService(FamilyTreeRepository repository) { this.repository = repository; }

    public List<FamilyTree> findAll() { return repository.findAll(); }

    @Transactional
    public FamilyTree create(String name, String description) {
        if (name == null || name.isBlank()) throw new BusinessException("Le nom est obligatoire");
        FamilyTree tree = new FamilyTree();
        tree.setName(name.trim()); tree.setDescription(description); tree.setCreatedAt(LocalDateTime.now());
        return repository.save(tree);
    }
}
