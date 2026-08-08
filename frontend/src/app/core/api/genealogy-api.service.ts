import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DocumentPreview, ImportResult } from '../../shared/models/document-import.model';
import { FamilyTree } from '../../shared/models/family-tree.model';
import { Person } from '../../shared/models/person.model';

@Injectable({ providedIn: 'root' })
export class GenealogyApiService {
  private readonly http = inject(HttpClient);
  private readonly personsUrl = '/api/persons';
  private readonly treesUrl = '/api/trees';

  getTrees(): Observable<FamilyTree[]> { return this.http.get<FamilyTree[]>(this.treesUrl); }
  createTree(name: string): Observable<FamilyTree> { return this.http.post<FamilyTree>(this.treesUrl, { name }); }
  getPeople(treeId?: number): Observable<Person[]> {
    return this.http.get<Person[]>(this.personsUrl, treeId == null ? {} : { params: { treeId } });
  }
  createPerson(person: Person): Observable<Person> { return this.http.post<Person>(this.personsUrl, person); }
  updatePerson(person: Person): Observable<Person> { return this.http.put<Person>(`${this.personsUrl}/${person.id}`, person); }
  deletePerson(id: number): Observable<void> { return this.http.delete<void>(`${this.personsUrl}/${id}`); }
  previewDocument(): Observable<DocumentPreview> { return this.http.get<DocumentPreview>('/api/import/document-preview'); }
  applyDocument(): Observable<ImportResult> { return this.http.post<ImportResult>('/api/import/document-apply', {}); }
  gedcomUrl(): string { return `${this.personsUrl}/export/gedcom`; }
}
