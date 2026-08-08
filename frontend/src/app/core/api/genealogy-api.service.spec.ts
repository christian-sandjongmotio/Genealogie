import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GenealogyApiService } from './genealogy-api.service';

describe('GenealogyApiService', () => {
  let service: GenealogyApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(GenealogyApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads people from the selected tree', () => {
    service.getPeople(7).subscribe(people => expect(people).toEqual([]));
    const request = http.expectOne(candidate => candidate.url === '/api/persons' && candidate.params.get('treeId') === '7');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('creates a family tree with its name', () => {
    service.createTree('Famille Test').subscribe(tree => expect(tree.id).toBe(2));
    const request = http.expectOne('/api/trees');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Famille Test' });
    request.flush({ id: 2, name: 'Famille Test' });
  });
});
