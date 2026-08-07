package be.famille.genealogie.domain.repository;

import be.famille.genealogie.domain.entity.FamilyTree;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyTreeRepository extends JpaRepository<FamilyTree, Long> {}
