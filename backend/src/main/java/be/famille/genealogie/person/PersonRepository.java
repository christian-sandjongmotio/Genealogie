package be.famille.genealogie.person;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PersonRepository extends JpaRepository<Person, Long> {
    List<Person> findByTreeIdOrderById(Long treeId);
}
