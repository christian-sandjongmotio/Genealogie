package be.famille.genealogie.person;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "persons")
public class Person {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private String firstName;
    @Column(nullable = false) private String lastName;
    private LocalDate birthDate;
    private LocalDate deathDate;
    private String birthPlace;
    @Column(columnDefinition = "TEXT") private String photoUrl;
    @Column(nullable = false) private String gender = "UNKNOWN";
    @Column(length = 2000) private String notes;
    private Long fatherId;
    private Long motherId;
    private Long spouseId;
    private Long parentId;
    private String sourceReference;
    @Column(nullable=false) private Long treeId = 1L;

    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getFirstName() { return firstName; } public void setFirstName(String value) { firstName = value; }
    public String getLastName() { return lastName; } public void setLastName(String value) { lastName = value; }
    public LocalDate getBirthDate() { return birthDate; } public void setBirthDate(LocalDate value) { birthDate = value; }
    public LocalDate getDeathDate() { return deathDate; } public void setDeathDate(LocalDate value) { deathDate = value; }
    public String getBirthPlace() { return birthPlace; } public void setBirthPlace(String value) { birthPlace = value; }
    public String getPhotoUrl() { return photoUrl; } public void setPhotoUrl(String value) { photoUrl = value; }
    public String getGender() { return gender; } public void setGender(String value) { gender = value == null ? "UNKNOWN" : value; }
    public String getNotes() { return notes; } public void setNotes(String value) { notes = value; }
    public Long getFatherId() { return fatherId; } public void setFatherId(Long value) { fatherId = value; }
    public Long getMotherId() { return motherId; } public void setMotherId(Long value) { motherId = value; }
    public Long getSpouseId() { return spouseId; } public void setSpouseId(Long value) { spouseId = value; }
    public Long getParentId() { return parentId; } public void setParentId(Long value) { parentId = value; }
    public String getSourceReference() { return sourceReference; } public void setSourceReference(String value) { sourceReference = value; }
    public Long getTreeId() { return treeId; } public void setTreeId(Long value) { treeId = value; }
}
