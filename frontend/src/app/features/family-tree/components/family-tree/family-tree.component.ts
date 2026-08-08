import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { Person } from '../../../../shared/models/person.model';

type FamilyPerson = Person;
interface Union {
  key: string;
  person: FamilyPerson;
  partner?: FamilyPerson;
  label?: string;
  children: FamilyPerson[];
}

@Component({
  selector: 'app-family-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './family-tree.component.html',
  styleUrl: './family-tree.component.scss',
})
export class FamilyTreeComponent implements OnChanges {
  private host = inject(ElementRef<HTMLElement>);
  @Input({ required: true }) people: FamilyPerson[] = [];
  @Input() root?: FamilyPerson;
  @Input() focusPersonId?: number | null;
  @Output() personSelected = new EventEmitter<FamilyPerson>();
  @Output() layoutChanged = new EventEmitter<number>();
  expanded = signal<Set<string>>(new Set());
  expandedPeople = signal<Set<number>>(new Set());
  activePerson = signal<FamilyPerson | null>(null);
  history = signal<FamilyPerson[]>([]);
  focusedUnion = signal<string | null>(null);

  ngOnChanges() {
    if (this.root) {
      this.expanded.set(new Set());
      this.expandedPeople.set(new Set());
      this.activePerson.set(this.root);
      this.history.set([]);
      this.focusedUnion.set(null);
      if (this.focusPersonId) setTimeout(() => this.revealPath(this.focusPersonId!), 0);
    }
  }
  private revealPath(targetId: number) {
    if (!this.root?.id) return;
    const chain: FamilyPerson[] = [];
    const visited = new Set<number>();
    let current = this.people.find(person => person.id === targetId);
    while (current?.id && !visited.has(current.id)) {
      visited.add(current.id);
      chain.unshift(current);
      if (current.id === this.root.id) break;
      current = this.people.find(person => person.id === current!.parentId)
        || this.people.find(person => person.id === current!.fatherId)
        || this.people.find(person => person.id === current!.motherId);
    }
    if (!chain.length || chain[0].id !== this.root.id) return;
    const unionKeys = new Set<string>();
    const peopleToOpen = new Set<number>();
    for (let index = 0; index < chain.length - 1; index++) {
      const parent = chain[index];
      const child = chain[index + 1];
      const union = this.unionsFor(parent).find(candidate => candidate.children.some(item => item.id === child.id));
      if (union) unionKeys.add(union.key);
      if (index + 1 < chain.length - 1 && child.id) peopleToOpen.add(child.id);
    }
    this.expanded.set(unionKeys);
    this.expandedPeople.set(peopleToOpen);
    setTimeout(() => {
      const target = this.host.nativeElement.querySelector(`[data-person-id="${targetId}"]`) as HTMLElement | null;
      target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      this.layoutChanged.emit(this.host.nativeElement.querySelectorAll('.couple-card,.child-card').length);
    }, 160);
  }
  displayName(person: FamilyPerson) {
    return person.sourceReference
      ? `${person.lastName} ${person.firstName}`.trim()
      : `${person.firstName} ${person.lastName}`.trim();
  }
  initials(person: FamilyPerson) {
    const words = this.displayName(person).split(/\s+/);
    return `${words[0]?.[0] || ''}${words[1]?.[0] || ''}`;
  }
  year(date?: string) {
    return date?.slice(0, 4) || '—';
  }
  hasDescendants(person: FamilyPerson) {
    return this.unionsFor(person).some((union) => union.children.length);
  }
  canOpen(person: FamilyPerson) {
    return this.spouses(person).length > 0 || this.hasDescendants(person);
  }
  isExpanded(key: string) {
    return this.expanded().has(key);
  }
  toggle(key: string, event: Event) {
    event.stopPropagation();
    this.withViewTransition(() => {
      this.expanded.update(current => {
        const next = new Set(current);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
      });
    });
  }
  displayedUnions(person: FamilyPerson) {
    return this.unionsFor(person);
  }
  focusOn(person: FamilyPerson, event: Event) {
    event.stopPropagation();
    if (!person.id) return;
    this.withViewTransition(() => this.expandedPeople.update(current => {
      const next = new Set(current);
      next.has(person.id!) ? next.delete(person.id!) : next.add(person.id!);
      return next;
    }));
  }
  isPersonExpanded(person: FamilyPerson) { return !!person.id && this.expandedPeople().has(person.id); }
  goBack() {
    const items = this.history();
    const previous = items.at(-1);
    if (!previous) return;
    this.withViewTransition(() => {
      this.history.set(items.slice(0, -1));
      this.activePerson.set(previous);
      this.expanded.set(new Set());
      this.focusedUnion.set(null);
    });
  }
  select(person: FamilyPerson) {
    this.personSelected.emit(person);
  }
  unionsFor(person: FamilyPerson): Union[] {
    if (!person.id) return [];
    const partners = this.people.filter(
      (candidate) => candidate.id === person.spouseId || candidate.spouseId === person.id,
    );
    const unions: Union[] = partners.map((partner) => ({
      key: `${person.id}-${partner.id}`,
      person,
      partner,
      children: this.sort(
        this.people.filter(
          (child) =>
            (child.fatherId === person.id && child.motherId === partner.id) ||
            (child.motherId === person.id && child.fatherId === partner.id),
        ),
      ),
    }));
    const assigned = new Set(unions.flatMap((union) => union.children.map((child) => child.id)));
    const otherChildren = this.people.filter(
      (child) =>
        !assigned.has(child.id) &&
        (child.parentId === person.id ||
          child.fatherId === person.id ||
          child.motherId === person.id),
    );
    if (otherChildren.length)
      unions.push({
        key: `${person.id}-other`,
        person,
        label: partners.length ? 'Autres femmes / conjoint inconnu' : undefined,
        children: this.sort(otherChildren),
      });
    if (!unions.length) unions.push({ key: `${person.id}-single`, person, children: [] });
    return unions;
  }
  private spouses(person: FamilyPerson) {
    return this.people.filter(
      (candidate) => candidate.id === person.spouseId || candidate.spouseId === person.id,
    );
  }
  private centerView() {
    setTimeout(() => {
      const stage = this.host.nativeElement.closest('.tree-stage');
      if (!stage) return;
      stage.scrollTo({ left: Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2), top: 0, behavior: 'smooth' });
    }, 90);
  }
  private withViewTransition(update: () => void) {
    const animatedDocument = document as Document & { startViewTransition?: (callback: () => void) => unknown };
    animatedDocument.startViewTransition ? animatedDocument.startViewTransition(update) : update();
    this.centerView();
    setTimeout(() => this.layoutChanged.emit(this.host.nativeElement.querySelectorAll('.couple-card,.child-card').length), 100);
  }
  private sort(people: FamilyPerson[]) {
    return [...people].sort((a, b) =>
      (a.sourceReference || '').localeCompare(b.sourceReference || '', undefined, {
        numeric: true,
      }),
    );
  }
}
