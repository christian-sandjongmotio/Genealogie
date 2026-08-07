package be.famille.genealogie.service;

import be.famille.genealogie.domain.entity.Person;
import be.famille.genealogie.domain.repository.PersonRepository;
import be.famille.genealogie.service.exception.BusinessException;
import be.famille.genealogie.service.exception.ResourceNotFoundException;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.FileInputStream;
import java.nio.file.*;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.*;

@Service
public class DocumentImportService {
    private static final Pattern ENTRY = Pattern.compile("^(\\d+(?:\\.\\d+)*\\.?)\\s+(.+)$");
    private final Path source;
    private final PersonRepository repository;
    private final JdbcTemplate jdbcTemplate;

    public DocumentImportService(@Value("${genealogy.source-document:../GENEALOGIE_SIMPLIFIE.doc}") String source,
                                 PersonRepository repository, JdbcTemplate jdbcTemplate) {
        this.source = Path.of(source).toAbsolutePath().normalize();
        this.repository = repository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public Preview preview() {
        if (!Files.isRegularFile(source)) throw new ResourceNotFoundException("Document source introuvable");
        try (FileInputStream stream = new FileInputStream(source.toFile());
             HWPFDocument document = new HWPFDocument(stream); WordExtractor extractor = new WordExtractor(document)) {
            List<String> lines = Arrays.stream(extractor.getText().split("\\R")).map(String::trim)
                .filter(line -> !line.isBlank()).limit(2000).toList();
            int contentStart = 0;
            for (int index = 0; index < lines.size(); index++)
                if (lines.get(index).matches("^1\\.\\s+MBA NZO YAKOUOP$")) contentStart = index;
            List<Candidate> candidates = lines.subList(contentStart, lines.size()).stream().map(ENTRY::matcher)
                .filter(Matcher::matches)
                .map(match -> new Candidate(cleanReference(match.group(1)), match.group(2).trim(), parentReference(cleanReference(match.group(1)))))
                .filter(candidate -> !candidate.name().matches(".*\\s\\d+$") && !candidate.name().matches("^\\d{2}/\\d{2}/\\d{4}.*")
                    && !normalize(candidate.name()).contains("credit lyonnais"))
                .distinct().toList();
            return new Preview(source.getFileName().toString(), lines.size(), lines, candidates);
        } catch (ResourceNotFoundException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BusinessException("Impossible de lire le document Word");
        }
    }

    @Transactional
    public ImportResult apply() {
        List<Candidate> candidates = preview().candidates();
        if (candidates.isEmpty()) throw new BusinessException("Aucune personne detectee");
        jdbcTemplate.execute("TRUNCATE TABLE persons RESTART IDENTITY CASCADE");
        Map<String, Long> identifiers = new HashMap<>();
        int linked = 0;
        int imported = 0;
        for (Candidate candidate : candidates) {
            int depth = candidate.reference().split("\\.").length;
            String rootReference = candidate.reference().split("\\.")[0];
            Long rootId = identifiers.get(rootReference);
            boolean maternalGroup = depth == 2 && candidate.name().toUpperCase().startsWith("ENFANTS D'AUTRES FEMMES");
            if (maternalGroup) { identifiers.put(candidate.reference(), rootId); continue; }
            String cleanName = candidate.name().replaceAll("\\s+", " ").trim();
            String[] name = cleanName.split(" ", 2);
            if (depth == 1 && !identifiers.isEmpty()) {
                String continuationName = cleanName.substring(cleanName.lastIndexOf(' ') + 1);
                Person continuation = repository.findAll().stream()
                    .filter(existing -> fullName(existing).equalsIgnoreCase(continuationName)).findFirst().orElse(null);
                if (continuation != null) {
                    String originalReference = continuation.getSourceReference();
                    continuation.setLastName(name[0]); continuation.setFirstName(name.length > 1 ? name[1] : "");
                    continuation.setNotes("Meme personne : reference " + originalReference + " et titre " + candidate.reference() + ". Nom developpe : " + cleanName);
                    repository.saveAndFlush(continuation); identifiers.put(candidate.reference(), continuation.getId()); continue;
                }
            }
            if (depth == 2 && rootId != null) {
                Person knownSpouse = repository.findAll().stream()
                    .filter(existing -> existing.getLastName().equalsIgnoreCase(name[0]))
                    .filter(existing -> normalize(existing.getFirstName()).contains("recuperee par timo"))
                    .findFirst().orElse(null);
                if (knownSpouse != null) {
                    String originalReference = knownSpouse.getSourceReference();
                    knownSpouse.setFirstName(name.length > 1 ? name[1] : ""); knownSpouse.setSpouseId(rootId);
                    knownSpouse.setNotes("Meme personne : reference " + originalReference + " et epouse au titre " + candidate.reference() + '.');
                    repository.saveAndFlush(knownSpouse); identifiers.put(candidate.reference(), knownSpouse.getId()); linked++; continue;
                }
            }
            Person person = new Person();
            person.setTreeId(1L); person.setLastName(name[0]); person.setFirstName(name.length > 1 ? name[1] : "");
            person.setSourceReference(candidate.reference());
            person.setNotes("Importe depuis GENEALOGIE_SIMPLIFIE.doc - reference " + candidate.reference() + ". Nom original : " + cleanName);
            if (depth == 2 && rootId != null) { person.setSpouseId(rootId); linked++; }
            else if (depth == 3 && rootId != null) {
                Long wifeOrGroup = identifiers.get(candidate.parentReference()); person.setFatherId(rootId);
                if (wifeOrGroup != null && !wifeOrGroup.equals(rootId)) person.setMotherId(wifeOrGroup); linked++;
            } else if (!rootReference.equals("1") && depth >= 4 && depth % 2 == 0) {
                Long principalId = identifiers.get(candidate.parentReference());
                if (principalId != null) { person.setSpouseId(principalId); linked++; }
            } else if (!rootReference.equals("1") && depth >= 5 && depth % 2 == 1) {
                Long spouseId = identifiers.get(candidate.parentReference());
                Long principalId = identifiers.get(parentReference(candidate.parentReference()));
                if (principalId != null) person.setFatherId(principalId);
                if (spouseId != null) person.setMotherId(spouseId);
                if (principalId != null || spouseId != null) linked++;
            } else {
                Long parentId = nearestParent(candidate.reference(), identifiers);
                if (parentId != null) { person.setParentId(parentId); linked++; }
            }
            Person saved = repository.saveAndFlush(person);
            identifiers.put(candidate.reference(), saved.getId()); imported++;
        }
        return new ImportResult(imported, linked);
    }

    private static String fullName(Person person) { return (person.getLastName() + " " + person.getFirstName()).trim(); }
    private static String normalize(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
    }
    private static String cleanReference(String value) { return value.endsWith(".") ? value.substring(0, value.length() - 1) : value; }
    private static String parentReference(String value) { int separator = value.lastIndexOf('.'); return separator < 0 ? null : value.substring(0, separator); }
    private static Long nearestParent(String reference, Map<String, Long> identifiers) {
        String parent = parentReference(reference);
        while (parent != null) { if (identifiers.containsKey(parent)) return identifiers.get(parent); parent = parentReference(parent); }
        return null;
    }

    public record Candidate(String reference, String name, String parentReference) {}
    public record Preview(String fileName, int lineCount, List<String> lines, List<Candidate> candidates) {}
    public record ImportResult(int imported, int linked) {}
}
