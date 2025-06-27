// Jasmine imports are global
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuildsComponent } from './guilds.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

describe('GuildsComponent', () => {
  let component: GuildsComponent;
  let fixture: ComponentFixture<GuildsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GuildsComponent,
        HttpClientTestingModule,
        ReactiveFormsModule
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuildsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    expect(component.showModal).toBe(false);
    expect(component.guilds).toEqual([]);
    expect(component.filteredGuilds).toEqual([]);
    expect(component.loading).toBe(false);
    expect(component.submitting).toBe(false);
    expect(component.searchTerm).toBe('');
    expect(component.errorMessage).toBe('');
  });

  it('should load guilds successfully', () => {
    const mockGuilds = [
      { uuid: 'guild1', name: 'Guild 1', memberCount: '10' },
      { uuid: 'guild2', name: 'Guild 2', memberCount: '20' }
    ];

    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush(mockGuilds);

    expect(component.guilds).toEqual(mockGuilds);
    expect(component.filteredGuilds).toEqual(mockGuilds);
    expect(component.loading).toBe(false);
  });

  it('should handle guilds loading with nested data structure', () => {
    const mockResponse = {
      data: [
        { uuid: 'guild1', name: 'Guild 1' },
        { uuid: 'guild2', name: 'Guild 2' }
      ]
    };

    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush(mockResponse);

    expect(component.guilds).toEqual(mockResponse.data);
  });

  it('should handle guilds loading error', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.error(new ErrorEvent('Network error'));

    expect(component.loading).toBe(false);
  });

  it('should filter guilds correctly', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    component.guilds = [
      { uuid: 'guild1', name: 'Test Guild 1' },
      { uuid: 'guild2', name: 'Another Guild' },
      { uuid: 'guild3', name: 'Test Guild 2' }
    ];

    component.searchTerm = 'test';
    component.filterGuilds();

    expect(component.filteredGuilds).toEqual([
      { uuid: 'guild1', name: 'Test Guild 1' },
      { uuid: 'guild3', name: 'Test Guild 2' }
    ]);
  });

  it('should filter guilds by UUID', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    component.guilds = [
      { uuid: 'guild1', name: 'Guild 1' },
      { uuid: 'guild2', name: 'Guild 2' },
      { uuid: 'test123', name: 'Guild 3' }
    ];

    component.searchTerm = 'test';
    component.filterGuilds();

    expect(component.filteredGuilds).toEqual([
      { uuid: 'test123', name: 'Guild 3' }
    ]);
  });

  it('should show all guilds when no search term', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    component.guilds = [
      { uuid: 'guild1', name: 'Guild 1' },
      { uuid: 'guild2', name: 'Guild 2' }
    ];

    component.searchTerm = '';
    component.filterGuilds();

    expect(component.filteredGuilds).toEqual(component.guilds);
  });

  it('should handle search input', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    spyOn(component, 'filterGuilds');
    const event = { target: { value: 'test search' } } as any;

    component.onSearch(event);

    expect(component.searchTerm).toBe('test search');
    expect(component.filterGuilds).toHaveBeenCalled();
  });

  it('should open modal', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    component.openModal();
    expect(component.showModal).toBe(true);
  });

  it('should close modal and reset form', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    component.showModal = true;
    component.guildForm.patchValue({ uuid: 'test123' });

    component.closeModal();

    expect(component.showModal).toBe(false);
    expect(component.guildForm.get('uuid')?.value).toBe('');
  });

  it('should submit guild successfully', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    const mockFormData = { uuid: '123456789012345678' };
    component.guildForm.patchValue(mockFormData);
    component.submitting = false;
    component.errorMessage = '';

    component.submitGuild();

    expect(component.submitting).toBe(true);

    const postReq = httpMock.expectOne('/api/guilds');
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body).toEqual({
      uuid: '123456789012345678',
      name: 'Chargement...',
      memberCount: '0',
      configuration: {}
    });
    postReq.flush({ success: true });

    const getReq = httpMock.expectOne('/api/guilds');
    getReq.flush([]);

    expect(component.submitting).toBe(false);
    expect(component.showModal).toBe(false);
  });

  it('should not submit invalid form', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    component.guildForm.patchValue({ uuid: '' });
    component.guildForm.markAsTouched();
    component.guildForm.updateValueAndValidity();

    component.submitGuild();

    expect(component.submitting).toBe(false);
  });

  it('should handle guild submission error', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    const mockFormData = { uuid: '123456789012345678' };
    component.guildForm.patchValue(mockFormData);
    component.submitting = false;
    component.errorMessage = '';

    component.submitGuild();

    const postReq = httpMock.expectOne('/api/guilds');
    postReq.error(new ErrorEvent('Network error'));

    expect(component.submitting).toBe(false);
    expect(component.errorMessage).toBe('Erreur lors de la création de la guilde');
  });

  it('should handle guild submission error without message', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    const mockFormData = { uuid: '123456789012345678' };
    component.guildForm.patchValue(mockFormData);
    component.submitting = false;
    component.errorMessage = '';

    component.submitGuild();

    const postReq = httpMock.expectOne('/api/guilds');
    postReq.error(new ErrorEvent('Network error'), { status: 500 });

    expect(component.submitting).toBe(false);
    expect(component.errorMessage).toBe('Erreur lors de la création de la guilde');
  });

  it('should validate form correctly', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    const uuidControl = component.guildForm.get('uuid');
    
    // Test validation required
    uuidControl?.setValue('');
    expect(uuidControl?.hasError('required')).toBe(true);
    
    // Test validation minLength
    uuidControl?.setValue('1234567890123456'); // 16 caractères
    expect(uuidControl?.hasError('minlength')).toBe(true);
    
    // Test validation maxLength
    uuidControl?.setValue('12345678901234567890'); // 20 caractères
    expect(uuidControl?.hasError('maxlength')).toBe(true);
    
    // Test validation valide
    uuidControl?.setValue('123456789012345678'); // 18 caractères
    expect(uuidControl?.valid).toBe(true);
  });

  it('should handle case-insensitive search', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    component.guilds = [
      { uuid: 'guild1', name: 'Test Guild' },
      { uuid: 'guild2', name: 'Another Guild' }
    ];

    component.searchTerm = 'TEST';
    component.filterGuilds();

    expect(component.filteredGuilds).toEqual([
      { uuid: 'guild1', name: 'Test Guild' }
    ]);
  });

  it('should refresh members', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    component.refreshMembers();

    const refreshReq = httpMock.expectOne('/api/guilds');
    refreshReq.flush([]);
  });

  it('should delete guild successfully', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    const mockGuild = { uuid: 'guild1', name: 'Test Guild' };
    spyOn(window, 'confirm').and.returnValue(true);

    component.deleteGuild(mockGuild);

    const deleteReq = httpMock.expectOne('/api/guilds/guild1');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({});

    const getReq = httpMock.expectOne('/api/guilds');
    getReq.flush([]);
  });

  it('should not delete guild when user cancels', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    const mockGuild = { uuid: 'guild1', name: 'Test Guild' };
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteGuild(mockGuild);

    httpMock.expectNone('/api/guilds/guild1');
  });

  it('should handle guild deletion error', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);
    
    const mockGuild = { uuid: 'guild1', name: 'Test Guild' };
    spyOn(window, 'confirm').and.returnValue(true);

    component.deleteGuild(mockGuild);

    const deleteReq = httpMock.expectOne('/api/guilds/guild1');
    deleteReq.error(new ErrorEvent('Network error'));
  });

  it('should handle null/undefined guild data', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush(null);

    expect(component.guilds).toEqual([]);
    expect(component.filteredGuilds).toEqual([]);
  });

  it('should handle empty guilds array', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/guilds');
    req.flush([]);

    expect(component.guilds).toEqual([]);
    expect(component.filteredGuilds).toEqual([]);
  });
});
