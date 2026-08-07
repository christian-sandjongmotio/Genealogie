package be.famille.genealogie.domain.repository;

import be.famille.genealogie.domain.entity.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PersonRepository extends JpaRepository<Person, Long> {
    List<Person> findByTreeIdOrderById(Long treeId);
}
