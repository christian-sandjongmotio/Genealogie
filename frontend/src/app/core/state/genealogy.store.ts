import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, switchMap, tap, throwError } from 'rxjs';
import { GenealogyApiService } from '../api/genealogy-api.service';
import { FamilyTree } from '../../shared/models/family-tree.model';
import { Person } from '../../shared/models/person.model';

@Injectable({ providedIn: 'root' })
export class GenealogyStore {
  private readonly api = inject(GenealogyApiService);
  readonly people = signal<Person[]>([]);
  readonly trees = signal<FamilyTree[]>([]);
  readonly activeTreeId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  initialize(): Observable<Person[]> {
    this.loading.set(true); this.error.set(null);
    return this.api.getTrees().pipe(
      tap(trees => this.trees.set(trees)),
      switchMap(trees => {
        const treeId = trees[0]?.id ?? 1;
        this.activeTreeId.set(treeId);
        if (!trees.length) this.trees.set([{ id: treeId, name: 'Famille MBA DIO TIMO' }]);
        return this.api.getPeople(treeId);
      }),
      tap(people => this.people.set(people)),
      catchError(error => this.captureError(error)),
      finalize(() => this.loading.set(false)),
    );
  }

  loadLegacyPeople(): Observable<Person[]> {
    return this.api.getPeople().pipe(tap(people => this.people.set(people)), catchError(error => this.captureError(error)));
  }
  selectTree(id: number): Observable<Person[]> {
    this.activeTreeId.set(id); this.loading.set(true); this.error.set(null);
    return this.api.getPeople(id).pipe(tap(people => this.people.set(people)), catchError(error => this.captureError(error)), finalize(() => this.loading.set(false)));
  }
  createTree(name: string): Observable<FamilyTree> {
    return this.api.createTree(name).pipe(tap(tree => this.trees.update(items => [...items, tree])));
  }
  savePerson(person: Person): Observable<Person> {
    const request = person.id ? this.api.updatePerson(person) : this.api.createPerson(person);
    return request.pipe(tap(saved => this.people.update(items => items.some(item => item.id === saved.id)
      ? items.map(item => item.id === saved.id ? saved : item) : [...items, saved])));
  }
  deletePerson(id: number): Observable<void> {
    return this.api.deletePerson(id).pipe(tap(() => this.people.update(items => items.filter(item => item.id !== id).map(item => ({
      ...item,
      fatherId: item.fatherId === id ? undefined : item.fatherId,
      motherId: item.motherId === id ? undefined : item.motherId,
      spouseId: item.spouseId === id ? undefined : item.spouseId,
      parentId: item.parentId === id ? undefined : item.parentId,
    })))));
  }
  private captureError(error: Error): Observable<never> {
    this.error.set(error.message);
    return throwError(() => error);
  }
}
