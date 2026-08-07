import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { FamilyTreeComponent } from './family-tree.component';

interface Person {
  id?: number;
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  notes?: string;
  photoUrl?: string;
  gender?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  fatherId?: number;
  motherId?: number;
  spouseId?: number;
  parentId?: number;
  sourceReference?: string;
  treeId?: number;
}
interface FamilyTree { id:number; name:string; description?:string; }
interface TreeLink {
  id: string;
  path: string;
}
interface DocumentPreview { fileName:string; lineCount:number; lines:string[]; candidates:{reference:string;name:string;parentReference?:string}[]; }

@Component({
  selector: 'app-root',
  imports: [FormsModule, FamilyTreeComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  people = signal<Person[]>([]);
  selected = signal<Person | null>(null);
  formOpen = signal(false);
  scale = signal(1);
  activeBranch = signal<string | null>(null);
  view = signal<'tree' | 'people' | 'archives'>('tree');
  links = signal<TreeLink[]>([]);
  documentPreview = signal<DocumentPreview | null>(null);
  trees = signal<FamilyTree[]>([]);
  activeTreeId = signal<number | null>(null);
  rootId = signal<number | null>(null);
  searchedPersonId = signal<number | null>(null);
  expanded = signal<Set<number>>(new Set());
  query = '';
  formContext = '';
  photoCropSource: string | null = null;
  photoCropZoom = 1;
  photoCropX = 50;
  photoCropY = 50;
  treeDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragScrollLeft = 0;
  private dragScrollTop = 0;
  draft: Person = this.empty();
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  get generations(): Person[][] {
    const root = this.personById(this.rootId() ?? this.roots[0]?.id);
    if (!root) return [];
    const result: Person[][] = [[root, ...this.spousesOf(root)]];
    let current = this.childrenOf(root);
    while (current.length) {
      result.push(this.sortByReference(current));
      current = current.flatMap((person) => this.expanded().has(person.id!) ? this.childrenOf(person) : []);
    }
    return result;
  }
  get generationCount() {
    return Math.max(0, ...this.people().map(person => person.sourceReference?.split('.').length || 1));
  }
  get roots() { return this.people().filter(person => (person.sourceReference && !person.sourceReference.includes('.')) || (!person.sourceReference && !person.parentId && !person.fatherId && !person.motherId && !person.spouseId)); }
  get placesCount() {
    return new Set(
      this.people()
        .map((p) => p.birthPlace)
        .filter(Boolean),
    ).size;
  }
  get parentChoices() {
    return this.people().filter((p) => p.id !== this.draft.id);
  }
  get treeSearchResults() {
    const term = this.normalizeSearch(this.query.trim());
    if (term.length < 2) return [];
    return this.people()
      .filter(person => this.normalizeSearch(`${person.lastName} ${person.firstName} ${person.sourceReference || ''}`).includes(term))
      .sort((a, b) => this.comparePeopleByName(a, b))
      .slice(0, 8);
  }
  get sortedPeople() {
    return [...this.people()].sort((a, b) => this.comparePeopleByName(a, b));
  }
  ngOnInit() {
    this.http.get<FamilyTree[]>('/api/trees').subscribe({
      next: trees => {
        this.trees.set(trees);
        if (trees.length) this.selectTree(trees[0].id);
      },
      // Compatibilité avec un backend encore démarré sur l'ancienne version :
      // l'arbre historique reste visible au lieu de laisser un écran vide.
      error: () => {
        this.trees.set([{ id: 1, name: 'Famille MBA DIO TIMO' }]);
        this.activeTreeId.set(1);
        this.http.get<Person[]>('/api/persons').subscribe(people => {
          this.people.set(people);
          this.rootId.set(this.roots[0]?.id ?? null);
          this.scheduleLinks();
        });
      },
    });
  }
  selectTree(id:number){this.activeTreeId.set(Number(id));this.http.get<Person[]>(`/api/persons?treeId=${id}`).subscribe({next:people=>{this.people.set(people);this.rootId.set(this.roots[0]?.id??null);this.selected.set(null);this.scheduleLinks();},error:()=>alert('Impossible de charger cet arbre. Redémarrez le backend puis réessayez.')});}
  createTree(){const name=prompt('Nom du nouvel arbre familial :');if(!name?.trim())return;this.http.post<FamilyTree>('/api/trees',{name:name.trim()}).subscribe({next:tree=>{this.trees.update(items=>[...items,tree]);this.selectTree(tree.id);},error:()=>alert('La création de l’arbre nécessite la nouvelle version du backend. Redémarrez Spring Boot puis réessayez.')});}
  ngAfterViewInit() {
    this.scheduleLinks();
  }
  @HostListener('window:resize') onResize() {
    this.scheduleLinks();
  }
  setView(view: 'tree' | 'people' | 'archives') {
    this.view.set(view);
    this.selected.set(null);
    this.scheduleLinks();
  }
  select(p: Person) {
    this.selected.set(p);
  }
  setRoot(id: number) { this.searchedPersonId.set(null); this.rootId.set(Number(id)); this.expanded.set(new Set()); this.scheduleLinks(); }
  chooseTreeSearch(person: Person) {
    this.showPersonTree(person);
  }
  showPersonTree(person: Person) {
    if (!person.id) return;
    let ancestor = person;
    const visited = new Set<number>();
    while (ancestor.id && !visited.has(ancestor.id)) {
      visited.add(ancestor.id);
      const parent = this.personById(ancestor.parentId)
        || this.personById(ancestor.fatherId)
        || this.personById(ancestor.motherId);
      if (!parent) break;
      ancestor = parent;
    }
    this.view.set('tree');
    this.rootId.set(ancestor.id!);
    this.searchedPersonId.set(person.id);
    this.query = '';
    this.selected.set(null);
    this.expanded.set(new Set());
    this.scale.set(1);
    this.scheduleLinks();
    setTimeout(() => {
      const stage = document.querySelector('.tree-stage') as HTMLElement | null;
      stage?.scrollTo({ left: Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2), top: 0, behavior: 'smooth' });
    }, 100);
  }
  openFirstTreeSearchResult() {
    const person = this.treeSearchResults[0];
    if (person) this.chooseTreeSearch(person);
  }
  toggle(person: Person, event: Event) { event.stopPropagation(); if (!person.id) return; this.expanded.update(current => { const next=new Set(current); next.has(person.id!)?next.delete(person.id!):next.add(person.id!); return next; }); this.scheduleLinks(); }
  hasChildren(person: Person) { return this.childrenOf(person).length > 0; }
  personById(id?: number) {
    return this.people().find((p) => p.id === id);
  }
  spousesOf(person: Person) {
    return this.people().filter((candidate) => candidate.id === person.spouseId || candidate.spouseId === person.id);
  }
  childrenOf(p: Person) {
    return this.people().filter((c) => c.parentId === p.id || c.fatherId === p.id || c.motherId === p.id);
  }
  initials(p: Person) {
    const name=this.displayName(p).split(/\s+/); return `${name[0]?.[0]||''}${name[1]?.[0]||''}`;
  }
  displayName(p: Person) { return p.sourceReference ? `${p.lastName} ${p.firstName}`.trim() : `${p.firstName} ${p.lastName}`.trim(); }
  private sortByReference(people: Person[]) { return [...people].sort((a,b)=>(a.sourceReference||'').localeCompare(b.sourceReference||'',undefined,{numeric:true})); }
  year(d?: string) {
    return d?.slice(0, 4) || '—';
  }
  formatDate(d?: string) {
    return d
      ? new Intl.DateTimeFormat('fr-BE', { dateStyle: 'long' }).format(new Date(`${d}T12:00:00`))
      : 'Non renseignée';
  }
  matches(p: Person) {
    const text =
      !this.query ||
      `${p.firstName} ${p.lastName} ${p.birthPlace}`
        .toLowerCase()
        .includes(this.query.toLowerCase());
    return text && (!this.activeBranch() || p.lastName === this.activeBranch());
  }
  private normalizeSearch(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  private comparePeopleByName(a: Person, b: Person) {
    return a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' })
      || a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' });
  }
  setBranch(b: string | null) {
    this.activeBranch.set(b);
  }
  zoomIn() {
    this.scale.update((v) => Math.min(1.35, v + 0.1));
    this.scheduleLinks();
  }
  zoomOut() {
    this.scale.update((v) => Math.max(0.65, v - 0.1));
    this.scheduleLinks();
  }
  fitTree(visibleCards: number) {
    setTimeout(() => {
      const stage = document.querySelector('.tree-stage') as HTMLElement | null;
      const content = document.querySelector('.family-tree-zoom') as HTMLElement | null;
      if (!stage || !content) return;
      const widthScale = (stage.clientWidth - 70) / Math.max(content.scrollWidth, 1);
      const heightScale = (stage.clientHeight - 70) / Math.max(content.scrollHeight, 1);
      const cardScale = 1 - Math.max(0, visibleCards - 5) * 0.018;
      this.scale.set(Math.max(0.35, Math.min(1, widthScale, heightScale, cardScale)));
      setTimeout(() => stage.scrollTo({ left: Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2), top: 0, behavior: 'smooth' }), 40);
    });
  }
  focusSearch() {
    this.searchInput?.nativeElement.focus();
  }
  startTreeDrag(event: PointerEvent) {
    if ((event.target as HTMLElement).closest('button, input, select, label')) return;
    const stage = event.currentTarget as HTMLElement;
    this.treeDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragScrollLeft = stage.scrollLeft;
    this.dragScrollTop = stage.scrollTop;
    stage.setPointerCapture(event.pointerId);
  }
  moveTreeDrag(event: PointerEvent) {
    if (!this.treeDragging) return;
    const stage = event.currentTarget as HTMLElement;
    stage.scrollLeft = this.dragScrollLeft - (event.clientX - this.dragStartX);
    stage.scrollTop = this.dragScrollTop - (event.clientY - this.dragStartY);
  }
  endTreeDrag(event: PointerEvent) {
    if (!this.treeDragging) return;
    this.treeDragging = false;
    const stage = event.currentTarget as HTMLElement;
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
  }
  async onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Choisissez une image JPG, PNG ou WebP.');
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('La photo ne peut pas dépasser 5 Mo. Choisissez un portrait cadré sur le visage.');
      input.value = '';
      return;
    }
    this.photoCropSource = await this.readPhoto(file);
    this.photoCropZoom = 1;
    this.photoCropX = 50;
    this.photoCropY = 50;
    input.value = '';
  }
  removePhoto() { this.draft.photoUrl = undefined; }
  cancelPhotoCrop() { this.photoCropSource = null; }
  applyPhotoCrop() {
    const source = this.photoCropSource;
    if (!source) return;
    const image = new Image();
    image.onload = () => {
      const size = 420;
      const coverScale = Math.max(size / image.width, size / image.height) * this.photoCropZoom;
      const drawnWidth = image.width * coverScale;
      const drawnHeight = image.height * coverScale;
      const overflowX = Math.max(0, drawnWidth - size);
      const overflowY = Math.max(0, drawnHeight - size);
      const destinationX = -(this.photoCropX / 100) * overflowX;
      const destinationY = -(this.photoCropY / 100) * overflowY;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas.getContext('2d')!.drawImage(image, destinationX, destinationY, drawnWidth, drawnHeight);
      this.draft.photoUrl = canvas.toDataURL('image/jpeg', 0.8);
      this.photoCropSource = null;
    };
    image.src = source;
  }
  private readPhoto(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }
  openForm(p?: Person) {
    this.formContext = '';
    this.draft = p ? { ...p } : this.empty();
    this.formOpen.set(true);
  }
  addSpouseOf(person: Person) {
    this.formContext = `Conjoint(e) de ${this.displayName(person)}`;
    this.draft = { ...this.empty(), spouseId: person.id };
    this.formOpen.set(true);
  }
  addChildOf(parent: Person, partner?: Person) {
    this.formContext = partner
      ? `Enfant de ${this.displayName(parent)} et ${this.displayName(partner)}`
      : `Enfant de ${this.displayName(parent)}`;
    let fatherId: number | undefined;
    let motherId: number | undefined;
    for (const adult of [parent, partner].filter(Boolean) as Person[]) {
      if (adult.gender === 'MALE') fatherId = adult.id;
      if (adult.gender === 'FEMALE') motherId = adult.id;
    }
    if (partner && !fatherId && !motherId) {
      fatherId = parent.id;
      motherId = partner.id;
    }
    this.draft = { ...this.empty(), parentId: parent.id, fatherId, motherId };
    this.formOpen.set(true);
  }
  closeForm() {
    this.formOpen.set(false);
    this.formContext = '';
  }
  save() {
    if (!this.draft.firstName || !this.draft.lastName) return;
    const req = this.draft.id
      ? this.http.put<Person>(`/api/persons/${this.draft.id}`, this.draft)
      : this.http.post<Person>('/api/persons', this.draft);
    req.subscribe({
      next: (p) => this.commit(p),
      error: (error) => alert(error?.error?.message || 'Impossible d’enregistrer cette personne. Vérifiez les relations familiales.'),
    });
  }
  deletePerson(p: Person) {
    if (!p.id || !confirm(`Supprimer ${p.firstName} ${p.lastName} ?`)) return;
    this.http
      .delete(`/api/persons/${p.id}`)
      .subscribe({ next: () => this.removeLocal(p), error: () => this.removeLocal(p) });
  }
  exportGedcom() {
    window.open('/api/persons/export/gedcom', '_blank');
  }
  previewDocument() {
    this.http.get<DocumentPreview>('/api/import/document-preview').subscribe({
      next: preview => this.documentPreview.set(preview),
      error: () => alert('Le document source ne peut pas être lu. Vérifiez que le backend est lancé depuis le dossier backend.'),
    });
  }
  applyDocument() {
    if (!confirm('Remplacer toutes les personnes actuelles par les données détectées dans le document ?')) return;
    this.http.post<{imported:number;linked:number}>('/api/import/document-apply', {}).subscribe({
      next: result => this.http.get<Person[]>('/api/persons').subscribe(people => { this.people.set(people); this.documentPreview.set(null); this.setView('tree'); alert(`${result.imported} personnes importées, dont ${result.linked} relations.`); }),
      error: () => alert('L’import a échoué. Aucune donnée n’a été remplacée.'),
    });
  }
  private removeLocal(p: Person) {
    this.people.update((all) =>
      all
        .filter((x) => x.id !== p.id)
        .map((x) => ({
          ...x,
          fatherId: x.fatherId === p.id ? undefined : x.fatherId,
          motherId: x.motherId === p.id ? undefined : x.motherId,
          spouseId: x.spouseId === p.id ? undefined : x.spouseId,
          parentId: x.parentId === p.id ? undefined : x.parentId,
        })),
    );
    this.selected.set(null);
    this.scheduleLinks();
  }
  private scheduleLinks() {
    setTimeout(() => this.calculateLinks(), 0);
  }
  private calculateLinks() {
    if (this.view() !== 'tree') return;
    const tree = document.querySelector('.tree') as HTMLElement | null;
    if (!tree) return;
    const root = tree.getBoundingClientRect(),
      next: TreeLink[] = [];
    for (const child of this.people()) {
      const childEl = document.querySelector(
        `[data-person-id="${child.id}"]`,
      ) as HTMLElement | null;
      if (!childEl) continue;
      for (const parentId of [child.parentId, child.fatherId, child.motherId]) {
        const parentEl = document.querySelector(
          `[data-person-id="${parentId}"]`,
        ) as HTMLElement | null;
        if (!parentEl) continue;
        const a = parentEl.getBoundingClientRect(),
          b = childEl.getBoundingClientRect(),
          x1 = (a.left + a.width / 2 - root.left) / this.scale(),
          y1 = (a.bottom - root.top) / this.scale(),
          x2 = (b.left + b.width / 2 - root.left) / this.scale(),
          y2 = (b.top - root.top) / this.scale(),
          mid = (y1 + y2) / 2;
        next.push({
          id: `${parentId}-${child.id}`,
          path: `M ${x1} ${y1} V ${mid} H ${x2} V ${y2}`,
        });
      }
    }
    this.links.set(next);
  }
  private commit(p: Person) {
    this.people.update((all) =>
      all.some((x) => x.id === p.id) ? all.map((x) => (x.id === p.id ? p : x)) : [...all, p],
    );
    this.formOpen.set(false);
    this.formContext = '';
    this.selected.set(p);
    this.scheduleLinks();
  }
  private empty(): Person {
    return { firstName: '', lastName: '', gender: 'UNKNOWN', birthDate: '', birthPlace: '', notes: '', treeId: this.activeTreeId() ?? undefined };
  }
}
