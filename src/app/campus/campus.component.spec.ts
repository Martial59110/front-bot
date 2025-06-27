// Jasmine imports are global
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampusComponent } from './campus.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CampusComponent', () => {
  let component: CampusComponent;
  let fixture: ComponentFixture<CampusComponent>;
  let httpMock: HttpTestingController;

  const mockGuilds = [
    { uuid: '123', name: 'Guild 1' },
    { uuid: '456', name: 'Guild 2' }
  ];

  const mockCampuses = [
    {
      uuidCampus: '789',
      name: 'Campus 1',
      uuidGuild: '123',
      createdAt: '2024-01-01T00:00:00.000Z',
      promotions: [{ name: 'Promo 1' }]
    },
    {
      uuidCampus: '101',
      name: 'Campus 2',
      uuidGuild: '456',
      createdAt: '2024-01-02T00:00:00.000Z',
      promotions: []
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CampusComponent,
        HttpClientTestingModule
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CampusComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    // Nettoyer toutes les requêtes HTTP en attente
    httpMock.verify();
  });

  it('should create', () => {
    // Gérer les requêtes d'initialisation
    const guildsReq = httpMock.expectOne('/api/guilds');
    guildsReq.flush({ data: mockGuilds });
    const campusesReq = httpMock.expectOne('/api/campuses');
    campusesReq.flush({ data: mockCampuses });
    
    expect(component).toBeTruthy();
  });

  it('should load guilds on init', () => {
    const req = httpMock.expectOne('/api/guilds');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockGuilds });
    
    // Gérer la requête des campus qui est aussi faite à l'init
    const campusesReq = httpMock.expectOne('/api/campuses');
    campusesReq.flush({ data: mockCampuses });
    
    expect(component.guilds).toEqual(mockGuilds);
  });

  it('should load campuses on init', () => {
    // Gérer la requête des guilds qui est faite en premier
    const guildsReq = httpMock.expectOne('/api/guilds');
    guildsReq.flush({ data: mockGuilds });
    
    const req = httpMock.expectOne('/api/campuses');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockCampuses });
    expect(component.campusList).toEqual(mockCampuses);
    expect(component.filteredCampuses).toEqual(mockCampuses);
  });

  it('should get guild name by uuid', () => {
    // Gérer les requêtes d'initialisation
    const guildsReq = httpMock.expectOne('/api/guilds');
    guildsReq.flush({ data: mockGuilds });
    const campusesReq = httpMock.expectOne('/api/campuses');
    campusesReq.flush({ data: mockCampuses });
    
    expect(component.getGuildName('123')).toBe('Guild 1');
    expect(component.getGuildName('999')).toBe('999'); // UUID non trouvé
  });

  it('should filter campuses by search term', () => {
    // Gérer les requêtes d'initialisation
    const guildsReq = httpMock.expectOne('/api/guilds');
    guildsReq.flush({ data: mockGuilds });
    const campusesReq = httpMock.expectOne('/api/campuses');
    campusesReq.flush({ data: mockCampuses });
    
    // Test recherche par nom
    component.searchTerm = 'Campus 1';
    component.filterCampuses();
    expect(component.filteredCampuses.length).toBe(1);
    expect(component.filteredCampuses[0].name).toBe('Campus 1');

    // Test recherche par nom de serveur
    component.searchTerm = 'Guild 2';
    component.filterCampuses();
    expect(component.filteredCampuses.length).toBe(1);
    expect(component.filteredCampuses[0].name).toBe('Campus 2');
  });

  it('should open and close add modal', () => {
    // Gérer les requêtes d'initialisation
    const guildsReq = httpMock.expectOne('/api/guilds');
    guildsReq.flush({ data: mockGuilds });
    const campusesReq = httpMock.expectOne('/api/campuses');
    campusesReq.flush({ data: mockCampuses });
    
    expect(component.showModal).toBeFalsy();
    component.openModal();
    expect(component.showModal).toBeTruthy();
    component.closeModal();
    expect(component.showModal).toBeFalsy();
    expect(component.campusForm.pristine).toBeTruthy();
  });

  it('should open and close edit modal', () => {
    // Gérer les requêtes d'initialisation
    const guildsReq = httpMock.expectOne('/api/guilds');
    guildsReq.flush({ data: mockGuilds });
    const campusesReq = httpMock.expectOne('/api/campuses');
    campusesReq.flush({ data: mockCampuses });
    
    const campus = mockCampuses[0];
    expect(component.showEditModal).toBeFalsy();
    component.openEditModal(campus);
    expect(component.showEditModal).toBeTruthy();
    expect(component.editingCampus).toBe(campus);
    expect(component.editCampusForm.get('name')?.value).toBe(campus.name);
    
    component.closeEditModal();
    expect(component.showEditModal).toBeFalsy();
    expect(component.editingCampus).toBeNull();
    expect(component.editCampusForm.pristine).toBeTruthy();
  });

  it('should submit new campus', () => {
    // Gérer les requêtes d'initialisation
    const guildsReq = httpMock.expectOne('/api/guilds');
    guildsReq.flush({ data: mockGuilds });
    const campusesReq = httpMock.expectOne('/api/campuses');
    campusesReq.flush({ data: mockCampuses });
    
    const newCampus = { name: 'New Campus', uuidGuild: '123' };
    component.campusForm.patchValue(newCampus);
    
    component.submitCampus();
    const req = httpMock.expectOne('/api/campuses');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newCampus);
    req.flush({});
    
    // Vérifie que loadCampuses est appelé après la création
    const loadReq = httpMock.expectOne('/api/campuses');
    expect(loadReq.request.method).toBe('GET');
    loadReq.flush({ data: mockCampuses });
  });

  it('should submit campus edit', () => {
    // Gérer les requêtes d'initialisation
    const guildsReq = httpMock.expectOne('/api/guilds');
    guildsReq.flush({ data: mockGuilds });
    const campusesReq = httpMock.expectOne('/api/campuses');
    campusesReq.flush({ data: mockCampuses });
    
    const campus = mockCampuses[0];
    const newName = 'Updated Campus';
    component.openEditModal(campus);
    component.editCampusForm.patchValue({ name: newName });
    
    component.submitEditCampus();
    const req = httpMock.expectOne(`/api/campuses/${campus.uuidCampus}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: newName });
    req.flush({});
    
    // Vérifie que loadCampuses est appelé après la mise à jour
    const loadReq = httpMock.expectOne('/api/campuses');
    expect(loadReq.request.method).toBe('GET');
    loadReq.flush({ data: mockCampuses });
  });

  it('should delete campus', () => {
    // Gérer les requêtes d'initialisation
    const guildsReq = httpMock.expectOne('/api/guilds');
    guildsReq.flush({ data: mockGuilds });
    const campusesReq = httpMock.expectOne('/api/campuses');
    campusesReq.flush({ data: mockCampuses });
    
    const campus = mockCampuses[0];
    // Mock de confirm pour simuler l'acceptation de la suppression
    spyOn(window, 'confirm').and.returnValue(true);
    
    component.deleteCampus(campus);
    const req = httpMock.expectOne(`/api/campuses/${campus.uuidCampus}`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
    
    // Vérifie que loadCampuses est appelé après la suppression
    const loadReq = httpMock.expectOne('/api/campuses');
    expect(loadReq.request.method).toBe('GET');
    loadReq.flush({ data: mockCampuses });
  });
});
