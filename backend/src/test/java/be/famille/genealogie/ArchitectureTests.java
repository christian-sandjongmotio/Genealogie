package be.famille.genealogie;

import be.famille.genealogie.rest.importer.DocumentImportController;
import be.famille.genealogie.rest.person.PersonController;
import be.famille.genealogie.rest.tree.FamilyTreeController;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Field;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class ArchitectureTests {
    @Test
    void restControllersMustNotDependOnRepositories() {
        List<Class<?>> controllers = List.of(PersonController.class, FamilyTreeController.class, DocumentImportController.class);
        List<Field> forbiddenFields = controllers.stream().flatMap(controller -> List.of(controller.getDeclaredFields()).stream())
            .filter(field -> field.getType().getPackageName().contains("domain.repository"))
            .toList();
        assertThat(forbiddenFields).as("Les controllers REST ne doivent pas injecter de repository").isEmpty();
    }
}
