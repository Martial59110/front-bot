// Jasmine imports are global
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PromosComponent } from './promos.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { DragDropModule } from '@angular/cdk/drag-drop';

describe('PromosComponent', () => {
  let component: PromosComponent;
  let fixture: ComponentFixture<PromosComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PromosComponent,
        HttpClientTestingModule,
        ReactiveFormsModule,
        NgSelectModule,
        DragDropModule
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(PromosComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.promotions).toEqual([]);
    expect(component.loading).toBe(false);
    expect(component.searchTerm).toBe('');
    expect(component.showModal).toBe(false);
    expect(component.showEditModal).toBe(false);
    expect(component.page).toBe(1);
    expect(component.limit).toBe(10);
    expect(component.totalPromotions).toBe(0);
  });

  it('should open and close add modal', () => {
    expect(component.showModal).toBe(false);
    component.openModal();
    expect(component.showModal).toBe(true);
    component.closeModal();
    expect(component.showModal).toBe(false);
  });

  it('should open and close edit modal', () => {
    const mockPromo = { id: 1, name: 'Test Promo' };
    expect(component.showEditModal).toBe(false);
    component.openEditModal(mockPromo);
    expect(component.showEditModal).toBe(true);
    expect(component.editingPromo).toEqual(mockPromo);
    component.closeEditModal();
    expect(component.showEditModal).toBe(false);
  });

  it('should open and close formation modal', () => {
    expect(component.showFormationModal).toBe(false);
    component.openFormationModal();
    expect(component.showFormationModal).toBe(true);
    component.closeFormationModal();
    expect(component.showFormationModal).toBe(false);
  });

  it('should open and close members modal', () => {
    const mockPromo = { id: 1, name: 'Test Promo' };
    expect(component.showMembersModal).toBe(false);
    component.openMembersModal(mockPromo);
    expect(component.showMembersModal).toBe(true);
    expect(component.selectedPromoForMembers).toEqual(mockPromo);
    component.closeMembersModal();
    expect(component.showMembersModal).toBe(false);
  });

  it('should calculate total pages correctly', () => {
    component.totalPromotions = 25;
    component.limit = 10;
    expect(component.getTotalPages()).toBe(3);
    
    component.totalPromotions = 10;
    expect(component.getTotalPages()).toBe(1);
    
    component.totalPromotions = 0;
    expect(component.getTotalPages()).toBe(1);
  });

  it('should calculate formation total pages correctly', () => {
    component.asyncFormationsTotal = 25;
    component.asyncFormationsLimit = 5;
    expect(component.getFormationsTotalPages()).toBe(5);
  });

  it('should calculate member total pages correctly', () => {
    component.memberTotal = 21;
    component.memberLimit = 7;
    expect(component.getMemberTotalPages()).toBe(3);
  });

  it('should load guilds successfully', () => {
    const mockGuilds = [
      { id: 1, name: 'Guild 1' },
      { id: 2, name: 'Guild 2' }
    ];

    component.loadGuilds();

    const req = httpMock.expectOne('/api/guilds');
    expect(req.request.method).toBe('GET');
    req.flush(mockGuilds);

    expect(component.guilds).toEqual(mockGuilds);
  });

  it('should handle guilds loading error', () => {
    component.loadGuilds();

    const req = httpMock.expectOne('/api/guilds');
    req.error(new ErrorEvent('Network error'));

    expect(component.guilds).toEqual([]);
  });

  it('should load promotions successfully', () => {
    const mockResponse = {
      data: {
        data: {
          data: [
            { id: 1, name: 'Promo 1' },
            { id: 2, name: 'Promo 2' }
          ]
        }
      },
      total: 2
    };

    component.loadPromotions(1);

    const req = httpMock.expectOne('/api/promotions?page=1&limit=10');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    expect(component.loading).toBe(false);
    expect(component.totalPromotions).toBe(2);
  });

  it('should load promotions with search term', () => {
    component.searchTerm = 'test';
    component.loadPromotions(1);

    const req = httpMock.expectOne('/api/promotions?page=1&limit=10&search=test');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { data: { data: [] } }, total: 0 });
  });

  it('should handle promotions loading error', () => {
    component.loadPromotions(1);

    const req = httpMock.expectOne('/api/promotions?page=1&limit=10');
    req.error(new ErrorEvent('Network error'));

    expect(component.loading).toBe(false);
  });

  it('should search formations async successfully', () => {
    const mockResponse = {
      data: {
        data: [
          { id: 1, name: 'Formation 1', uuidGuild: 'guild1' },
          { id: 2, name: 'Formation 2', uuidGuild: 'guild1' }
        ]
      },
      total: 2
    };

    component.promoForm.patchValue({ uuidGuild: 'guild1' });
    component.searchFormationsAsync('test', 1);

    const req = httpMock.expectOne('/api/formations/lookup?page=1&limit=5&search=test');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    expect(component.asyncFormations).toEqual(mockResponse.data.data);
    expect(component.asyncFormationsTotal).toBe(2);
    expect(component.asyncFormationsPage).toBe(1);
  });

  it('should handle formation search without guild filter', () => {
    const mockResponse = {
      data: [
        { id: 1, name: 'Formation 1' },
        { id: 2, name: 'Formation 2' }
      ]
    };

    component.searchFormationsAsync('test', 1);

    const req = httpMock.expectOne('/api/formations/lookup?page=1&limit=5&search=test');
    req.flush(mockResponse);

    expect(component.asyncFormations).toEqual(mockResponse.data);
  });

  it('should handle formation search error', () => {
    component.searchFormationsAsync('test', 1);

    const req = httpMock.expectOne('/api/formations/lookup?page=1&limit=5&search=test');
    req.error(new ErrorEvent('Network error'));

    expect(component.asyncFormations).toEqual([]);
    expect(component.asyncFormationsTotal).toBe(0);
  });

  it('should navigate formation pages correctly', () => {
    component.asyncFormationsTotal = 15;
    component.asyncFormationsLimit = 5;
    component.asyncFormationsPage = 2;

    spyOn(component, 'searchFormationsAsync');

    component.loadPrevFormationsPage();
    expect(component.searchFormationsAsync).toHaveBeenCalledWith('', 1);

    component.loadNextFormationsPage();
    expect(component.searchFormationsAsync).toHaveBeenCalledWith('', 3);
  });

  it('should not navigate formation pages when at boundaries', () => {
    component.asyncFormationsPage = 1;
    spyOn(component, 'searchFormationsAsync');

    component.loadPrevFormationsPage();
    expect(component.searchFormationsAsync).not.toHaveBeenCalled();

    component.asyncFormationsPage = 3;
    component.asyncFormationsTotal = 15;
    component.asyncFormationsLimit = 5;

    component.loadNextFormationsPage();
    expect(component.searchFormationsAsync).not.toHaveBeenCalled();
  });

  it('should handle guild selection', () => {
    const mockCampuses = [
      { id: 1, name: 'Campus 1' },
      { id: 2, name: 'Campus 2' }
    ];

    const event = { target: { value: 'guild1' } } as any;
    component.onGuildSelect(event);

    expect(component.promoForm.get('uuidFormation')?.value).toBe('');
    expect(component.promoForm.get('uuidCampus')?.value).toBe('');

    const req = httpMock.expectOne('/api/campuses?uuidGuild=guild1');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { data: mockCampuses } });

    expect(component.campuses).toEqual(mockCampuses);
  });

  it('should handle guild selection with empty value', () => {
    const event = { target: { value: '' } } as any;
    component.onGuildSelect(event);

    expect(component.campuses).toEqual([]);
  });

  it('should handle formation search event', () => {
    spyOn(component, 'searchFormationsAsync');

    component.onFormationSearch('test');
    expect(component.searchFormationsAsync).toHaveBeenCalledWith('test', 1);

    component.onFormationSearch({ term: 'test2' });
    expect(component.searchFormationsAsync).toHaveBeenCalledWith('test2', 1);
  });

  it('should handle search input', () => {
    spyOn(component, 'loadPromotions');
    const event = { target: { value: 'test search' } } as any;

    component.onSearch(event);

    expect(component.searchTerm).toBe('test search');
    expect(component.page).toBe(1);
    expect(component.loadPromotions).toHaveBeenCalledWith(1);
  });

  it('should navigate pages correctly', () => {
    component.totalPromotions = 25;
    component.limit = 10;
    component.page = 2;

    spyOn(component, 'loadPromotions');

    component.prevPage();
    expect(component.page).toBe(1);
    expect(component.loadPromotions).toHaveBeenCalledWith(1);

    component.nextPage();
    expect(component.page).toBe(2);
    expect(component.loadPromotions).toHaveBeenCalledWith(2);
  });

  it('should not navigate pages when at boundaries', () => {
    component.page = 1;
    spyOn(component, 'loadPromotions');

    component.prevPage();
    expect(component.page).toBe(1);
    expect(component.loadPromotions).not.toHaveBeenCalled();

    component.totalPromotions = 10;
    component.limit = 10;
    component.page = 1;

    component.nextPage();
    expect(component.page).toBe(1);
    expect(component.loadPromotions).not.toHaveBeenCalled();
  });

  it('should open position modal', () => {
    const mockPromo = { id: 1, name: 'Test Promo' };
    component.openPositionModal(mockPromo);

    expect(component.showPositionModal).toBe(true);
    expect(component.selectedPromo).toEqual(mockPromo);
    expect(component.newPosition).toBe(0);
  });

  it('should close position modal', () => {
    component.showPositionModal = true;
    component.closePositionModal();

    expect(component.showPositionModal).toBe(false);
  });

  it('should update position successfully', () => {
    const mockPromo = { id: 1, name: 'Test Promo' };
    component.selectedPromo = mockPromo;
    component.newPosition = 5;
    component.submitting = false;

    component.updatePosition();

    expect(component.submitting).toBe(true);

    const req = httpMock.expectOne(`/api/promotions/${mockPromo.id}/position`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ position: 5 });
    req.flush({ success: true });

    expect(component.submitting).toBe(false);
    expect(component.showPositionModal).toBe(false);
  });

  it('should handle position update error', () => {
    const mockPromo = { id: 1, name: 'Test Promo' };
    component.selectedPromo = mockPromo;
    component.newPosition = 5;

    component.updatePosition();

    const req = httpMock.expectOne(`/api/promotions/${mockPromo.id}/position`);
    req.error(new ErrorEvent('Network error'));

    expect(component.submitting).toBe(false);
  });

  it('should handle drag and drop', () => {
    const mockBlock = {
      promotions: [
        { id: 1, name: 'Promo 1' },
        { id: 2, name: 'Promo 2' }
      ]
    };

    const mockEvent = {
      previousIndex: 0,
      currentIndex: 1,
      container: { data: mockBlock.promotions }
    } as any;

    spyOn(component, 'updatePosition');
    component.drop(mockEvent, mockBlock);

    expect(mockBlock.promotions[0].name).toBe('Promo 2');
    expect(mockBlock.promotions[1].name).toBe('Promo 1');
  });

  it('should get guild name correctly', () => {
    component.guilds = [
      { uuidGuild: 'guild1', name: 'Guild 1' },
      { uuidGuild: 'guild2', name: 'Guild 2' }
    ];

    expect(component.getGuildName('guild1')).toBe('Guild 1');
    expect(component.getGuildName('guild2')).toBe('Guild 2');
    expect(component.getGuildName('unknown')).toBe('Serveur inconnu');
  });

  it('should get avatar URL correctly', () => {
    const member = { discordId: '123456789' };
    expect(component.getAvatarUrl(member)).toBe('https://cdn.discordapp.com/avatars/123456789/123456789.png');

    const memberWithoutId = {};
    expect(component.getAvatarUrl(memberWithoutId)).toBe('assets/default-avatar.png');
  });

  it('should load all members successfully', () => {
    const mockMembers = [
      { id: 1, name: 'Member 1' },
      { id: 2, name: 'Member 2' }
    ];

    component.loadAllMembers();

    const req = httpMock.expectOne('/api/members?page=1&limit=100');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockMembers, total: 2 });

    expect(component.allMembers).toEqual(mockMembers);
  });

  it('should load promo members successfully', () => {
    const mockMembers = [
      { id: 1, name: 'Member 1' },
      { id: 2, name: 'Member 2' }
    ];

    component.selectedPromoForMembers = { id: 1 };
    component.loadPromoMembers();

    const req = httpMock.expectOne('/api/promotions/1/members?page=1&limit=7');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockMembers, total: 2 });

    expect(component.promoMembers).toEqual(mockMembers);
    expect(component.memberTotal).toBe(2);
  });

  it('should filter members correctly', () => {
    component.allMembers = [
      { name: 'John Doe' },
      { name: 'Jane Smith' },
      { name: 'Bob Johnson' }
    ];

    component.memberSearchTerm = 'john';
    component.filterMembers();

    expect(component.filteredMembers).toEqual([
      { name: 'John Doe' },
      { name: 'Bob Johnson' }
    ]);
  });

  it('should handle member search change', () => {
    spyOn(component, 'loadAvailableMembers');
    component.onMemberSearchChange('test');

    expect(component.memberSearchTerm).toBe('test');
    expect(component.loadAvailableMembers).toHaveBeenCalledWith('test');
  });

  it('should load available members successfully', () => {
    const mockMembers = [
      { id: 1, name: 'Available Member 1' },
      { id: 2, name: 'Available Member 2' }
    ];

    component.selectedPromoForMembers = { id: 1 };
    component.loadAvailableMembers('test');

    const req = httpMock.expectOne('/api/promotions/1/available-members?search=test');
    expect(req.request.method).toBe('GET');
    req.flush(mockMembers);

    expect(component.filteredMembers).toEqual(mockMembers);
  });

  it('should navigate member pages correctly', () => {
    component.memberTotal = 21;
    component.memberLimit = 7;
    component.memberPage = 2;

    spyOn(component, 'loadPromoMembers');

    component.prevMemberPage();
    expect(component.memberPage).toBe(1);
    expect(component.loadPromoMembers).toHaveBeenCalled();

    component.nextMemberPage();
    expect(component.memberPage).toBe(2);
    expect(component.loadPromoMembers).toHaveBeenCalled();
  });

  it('should add member to promo successfully', () => {
    const mockMember = { id: 1, name: 'Test Member' };
    component.selectedPromoForMembers = { id: 1 };
    component.addingMember = false;

    component.addMemberToPromo(mockMember);

    expect(component.addingMember).toBe(true);

    const req = httpMock.expectOne('/api/promotions/1/members');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ memberId: 1 });
    req.flush({ success: true });

    expect(component.addingMember).toBe(false);
  });

  it('should remove member from promo successfully', () => {
    const mockMember = { id: 1, name: 'Test Member' };
    component.selectedPromoForMembers = { id: 1 };
    component.removingMember = false;

    component.removeMemberFromPromo(mockMember);

    expect(component.removingMember).toBe(true);

    const req = httpMock.expectOne('/api/promotions/1/members/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });

    expect(component.removingMember).toBe(false);
  });

  it('should load guild blocks successfully', () => {
    const mockPromotions = [
      { id: 1, name: 'Promo 1', uuidGuild: 'guild1' },
      { id: 2, name: 'Promo 2', uuidGuild: 'guild1' },
      { id: 3, name: 'Promo 3', uuidGuild: 'guild2' }
    ];

    component.promotions = mockPromotions;
    component.guilds = [
      { uuidGuild: 'guild1', name: 'Guild 1' },
      { uuidGuild: 'guild2', name: 'Guild 2' }
    ];

    component.loadGuildBlocks();

    expect(component.guildBlocks.length).toBe(2);
    expect(component.guildBlocks[0].uuidGuild).toBe('guild1');
    expect(component.guildBlocks[0].promotions.length).toBe(2);
    expect(component.guildBlocks[1].uuidGuild).toBe('guild2');
    expect(component.guildBlocks[1].promotions.length).toBe(1);
  });

  it('should load promo member count successfully', () => {
    const mockCount = { count: 5 };
    component.loadPromoMemberCount('guild1');

    const req = httpMock.expectOne('/api/promotions/member-count?uuidGuild=guild1');
    expect(req.request.method).toBe('GET');
    req.flush(mockCount);

    expect(component.promoMemberCounts['guild1']).toBe(5);
  });

  it('should load campuses successfully', () => {
    const mockCampuses = [
      { id: 1, name: 'Campus 1' },
      { id: 2, name: 'Campus 2' }
    ];

    component.loadCampuses('guild1');

    const req = httpMock.expectOne('/api/campuses?uuidGuild=guild1');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { data: mockCampuses } });

    expect(component.campuses).toEqual(mockCampuses);
  });

  it('should validate date correctly', () => {
    const validator = component.dateValidator();
    const control = { value: '2024-01-01' } as any;

    expect(validator(control)).toBeNull();

    const invalidControl = { value: 'invalid-date' } as any;
    expect(validator(invalidControl)).toEqual({ invalidDate: true });
  });

  it('should validate date range correctly', () => {
    const validator = component.dateRangeValidator();
    const form = {
      get: (name: string) => ({
        value: name === 'startDate' ? '2024-01-01' : '2024-12-31'
      })
    } as any;

    expect(validator(form)).toBeNull();

    const invalidForm = {
      get: (name: string) => ({
        value: name === 'startDate' ? '2024-12-31' : '2024-01-01'
      })
    } as any;

    expect(validator(invalidForm)).toEqual({ dateRange: true });
  });

  it('should submit promo successfully', () => {
    const mockFormData = {
      uuidGuild: 'guild1',
      uuidFormation: 'formation1',
      name: 'Test Promo',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'active',
      uuidCampus: 'campus1'
    };

    component.promoForm.patchValue(mockFormData);
    component.submitting = false;

    component.submitPromo();

    expect(component.submitting).toBe(true);

    const req = httpMock.expectOne('/api/promotions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.uuidGuild).toBe('guild1');
    expect(req.request.body.name).toBe('Test Promo');
    req.flush({ success: true });

    expect(component.submitting).toBe(false);
    expect(component.showModal).toBe(false);
  });

  it('should submit edit promo successfully', () => {
    const mockFormData = {
      name: 'Updated Promo',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'active'
    };

    component.editPromoForm.patchValue(mockFormData);
    component.editingPromo = { id: 1 };
    component.submitting = false;

    component.submitEditPromo();

    expect(component.submitting).toBe(true);

    const req = httpMock.expectOne('/api/promotions/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.name).toBe('Updated Promo');
    req.flush({ success: true });

    expect(component.submitting).toBe(false);
    expect(component.showEditModal).toBe(false);
  });

  it('should delete promo successfully', () => {
    const mockPromo = { id: 1, name: 'Test Promo' };
    spyOn(component, 'loadPromotions');

    component.deletePromo(mockPromo);

    const req = httpMock.expectOne('/api/promotions/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });

    expect(component.loadPromotions).toHaveBeenCalled();
  });

  it('should select formation correctly', () => {
    const mockFormation = { id: 1, name: 'Test Formation' };
    component.selectFormation(mockFormation);

    expect(component.selectedFormation).toEqual(mockFormation);
    expect(component.promoForm.get('uuidFormation')?.value).toBe(1);
    expect(component.showFormationModal).toBe(false);
  });

  it('should handle formation dropdown open', () => {
    spyOn(component, 'searchFormationsAsync');
    component.onFormationDropdownOpen();

    expect(component.searchFormationsAsync).toHaveBeenCalledWith('', 1);
  });

  it('should load formations page successfully', () => {
    const mockFormations = [
      { id: 1, name: 'Formation 1' },
      { id: 2, name: 'Formation 2' }
    ];

    component.loadFormationsPage(2, 'test');

    const req = httpMock.expectOne('/api/formations?page=2&limit=5&search=test');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockFormations, total: 2 });

    expect(component.formationList).toEqual(mockFormations);
    expect(component.formationTotal).toBe(2);
    expect(component.formationPage).toBe(2);
  });
}); 