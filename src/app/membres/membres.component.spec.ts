// Jasmine imports are global
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MembresComponent } from './membres.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SanitizationService } from '../shared/services/sanitization.service';
import { CustomValidators } from '../shared/validators/custom.validators';
import { AbstractControl, ValidationErrors } from '@angular/forms';

describe('MembresComponent', () => {
  let component: MembresComponent;
  let fixture: ComponentFixture<MembresComponent>;
  let httpMock: HttpTestingController;
  let sanitizationService: jasmine.SpyObj<SanitizationService>;
  let customValidators: jasmine.SpyObj<CustomValidators>;

  const mockMembers = [
    {
      uuid: 'member1',
      guildUsername: 'user1',
      uuidDiscord: '123456789',
      status: 'active',
      roles: [{ name: 'Role 1' }, { name: 'Role 2' }],
      followedPromotions: [{ name: 'Promo 1' }],
      discordUser: { avatar: 'avatar1' }
    }
  ];

  beforeEach(async () => {
    const sanitizationSpy = jasmine.createSpyObj('SanitizationService', ['sanitize', 'sanitizeDiscordUsername']);
    sanitizationSpy.sanitizeDiscordUsername.and.returnValue('sanitized_username');
    
    // Mock des validateurs personnalisés avec des fonctions de validation valides
    const discordUsernameValidator = (control: AbstractControl): ValidationErrors | null => {
      return null; // Toujours valide pour les tests
    };
    
    const discordIdValidator = (control: AbstractControl): ValidationErrors | null => {
      return null; // Toujours valide pour les tests
    };
    
    const discordDiscriminatorValidator = (control: AbstractControl): ValidationErrors | null => {
      return null; // Toujours valide pour les tests
    };

    const validatorsSpy = jasmine.createSpyObj('CustomValidators', {
      'discordUsername': discordUsernameValidator,
      'discordId': discordIdValidator,
      'discordDiscriminator': discordDiscriminatorValidator
    });

    await TestBed.configureTestingModule({
      imports: [
        MembresComponent,
        HttpClientTestingModule,
        ReactiveFormsModule,
        NgSelectModule
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: SanitizationService, useValue: sanitizationSpy },
        { provide: CustomValidators, useValue: validatorsSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MembresComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    sanitizationService = TestBed.inject(SanitizationService) as jasmine.SpyObj<SanitizationService>;
    customValidators = TestBed.inject(CustomValidators) as jasmine.SpyObj<CustomValidators>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    const guildsReq = httpMock.expectOne('/api/guilds');
    guildsReq.flush([]);
    const promosReq = httpMock.expectOne('/api/promotions');
    promosReq.flush([]);
    
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    fixture.detectChanges();
    const guildsReq = httpMock.expectOne('/api/guilds');
    guildsReq.flush([]);
    const promosReq = httpMock.expectOne('/api/promotions');
    promosReq.flush([]);
    
    expect(component.membres).toEqual([]);
    expect(component.filteredMembres).toEqual([]);
    expect(component.loading).toBe(false);
    expect(component.searchTerm).toBe('');
    expect(component.showEditPseudoModal).toBe(false);
    expect(component.showEditPromosModal).toBe(false);
    expect(component.showEditRolesModal).toBe(false);
    expect(component.showAddMemberModal).toBe(false);
    expect(component.showDeleteMemberModal).toBe(false);
  });

  it('should get roles string', () => {
    const member = mockMembers[0];
    const rolesString = component.getRolesString(member);
    expect(rolesString).toBe('Role 1, Role 2');
  });

  it('should get roles string for member without roles', () => {
    const member = { ...mockMembers[0], roles: null };
    const rolesString = component.getRolesString(member);
    expect(rolesString).toBe('');
  });

  it('should get promos string', () => {
    const member = mockMembers[0];
    const promosString = component.getPromosString(member);
    expect(promosString).toBe('Promo 1');
  });

  it('should get promos string for member without promos', () => {
    const member = { ...mockMembers[0], followedPromotions: null };
    const promosString = component.getPromosString(member);
    expect(promosString).toBe('');
  });

  it('should get avatar URL', () => {
    const member = mockMembers[0];
    const avatarUrl = component.getAvatarUrl(member);
    expect(avatarUrl).toBe('https://cdn.discordapp.com/avatars/123456789/avatar1.png');
  });

  it('should get default avatar URL when no avatar', () => {
    const member = { ...mockMembers[0], discordUser: null };
    const avatarUrl = component.getAvatarUrl(member);
    expect(avatarUrl).toBe('https://cdn.discordapp.com/embed/avatars/0.png');
  });

  it('should load guild blocks successfully', () => {
    const mockGuilds = [
      { uuid: 'guild1', name: 'Guild 1' },
      { uuid: 'guild2', name: 'Guild 2' }
    ];

    component.loadGuildBlocks();

    const req = httpMock.expectOne('/api/guilds');
    expect(req.request.method).toBe('GET');
    req.flush(mockGuilds);

    // Gérer les appels HTTP automatiques pour chaque guilde
    const req1 = httpMock.expectOne('/api/members?uuidGuild=guild1&page=1&limit=7&search=');
    req1.flush({ data: [], total: 0 });
    const req2 = httpMock.expectOne('/api/members?uuidGuild=guild2&page=1&limit=7&search=');
    req2.flush({ data: [], total: 0 });

    expect(component.guildBlocks.length).toBe(2);
    expect(component.guildBlocks[0].uuidGuild).toBe('guild1');
    expect(component.guildBlocks[0].guildName).toBe('Guild 1');
    expect(component.guildBlocks[0].membres).toEqual([]);
    expect(component.guildBlocks[0].currentPage).toBe(1);
    expect(component.guildBlocks[0].pageSize).toBe(7);
  });

  it('should handle guild blocks loading error', () => {
    component.loadGuildBlocks();

    const req = httpMock.expectOne('/api/guilds');
    req.error(new ErrorEvent('Network error'));

    expect(component.guildBlocks).toEqual([]);
  });

  it('should load guild members successfully', () => {
    const mockBlock = {
      uuidGuild: 'guild1',
      guildName: 'Guild 1',
      membres: [] as any[],
      searchTerm: '',
      currentPage: 1,
      pageSize: 7,
      totalPages: 1,
      totalMembres: 0,
      loading: false
    };

    const mockMembersData = {
      data: mockMembers,
      total: 1
    };

    component.loadGuildMembers(mockBlock, 1, 7, 'test');

    const req = httpMock.expectOne('/api/members?uuidGuild=guild1&page=1&limit=7&search=test');
    expect(req.request.method).toBe('GET');
    req.flush(mockMembersData);

    expect(mockBlock.membres).toEqual(mockMembers);
    expect(mockBlock.totalMembres).toBe(1);
    expect(mockBlock.totalPages).toBe(1);
    expect(mockBlock.currentPage).toBe(1);
    expect(mockBlock.loading).toBe(false);
  });

  it('should handle guild members loading error', () => {
    const mockBlock = {
      uuidGuild: 'guild1',
      guildName: 'Guild 1',
      membres: [],
      searchTerm: '',
      currentPage: 1,
      pageSize: 7,
      totalPages: 1,
      totalMembres: 0,
      loading: false
    };

    component.loadGuildMembers(mockBlock, 1, 7, '');

    const req = httpMock.expectOne('/api/members?uuidGuild=guild1&page=1&limit=7&search=');
    req.error(new ErrorEvent('Network error'));

    expect(mockBlock.membres).toEqual([]);
    expect(mockBlock.totalMembres).toBe(0);
    expect(mockBlock.totalPages).toBe(1);
    expect(mockBlock.currentPage).toBe(1);
    expect(mockBlock.loading).toBe(false);
  });

  it('should navigate guild pages correctly', () => {
    const mockBlock = {
      uuidGuild: 'guild1',
      currentPage: 2,
      totalPages: 3,
      pageSize: 7,
      searchTerm: '',
      loading: false
    };

    spyOn(component, 'loadGuildMembers');

    component.prevGuildPage(mockBlock);
    expect(component.loadGuildMembers).toHaveBeenCalledWith(mockBlock, 1, 7, '');

    component.nextGuildPage(mockBlock);
    expect(component.loadGuildMembers).toHaveBeenCalledWith(mockBlock, 3, 7, '');
  });

  it('should not navigate guild pages when at boundaries', () => {
    const mockBlock = {
      uuidGuild: 'guild1',
      currentPage: 1,
      totalPages: 3,
      pageSize: 7,
      searchTerm: '',
      loading: false
    };

    spyOn(component, 'loadGuildMembers');

    component.prevGuildPage(mockBlock);
    expect(component.loadGuildMembers).not.toHaveBeenCalled();

    mockBlock.currentPage = 3;
    component.nextGuildPage(mockBlock);
    expect(component.loadGuildMembers).not.toHaveBeenCalled();
  });

  it('should handle guild search', () => {
    const mockBlock = {
      uuidGuild: 'guild1',
      currentPage: 1,
      totalPages: 1,
      pageSize: 7,
      searchTerm: 'test',
      loading: false
    };

    spyOn(component, 'loadGuildMembers');
    component.onGuildSearch(mockBlock);

    expect(component.loadGuildMembers).toHaveBeenCalledWith(mockBlock, 1, 7, 'test');
  });

  it('should load promotions successfully', () => {
    const mockPromotions = [
      { id: 1, name: 'Promotion 1' },
      { id: 2, name: 'Promotion 2' }
    ];

    component.loadPromotions();

    const req = httpMock.expectOne('/api/promotions');
    expect(req.request.method).toBe('GET');
    req.flush(mockPromotions);

    expect(component.promotions).toEqual(mockPromotions);
  });

  it('should handle promotions loading with nested data structure', () => {
    const mockResponse = {
      data: {
        data: [
          { id: 1, name: 'Promotion 1' },
          { id: 2, name: 'Promotion 2' }
        ]
      }
    };

    component.loadPromotions();

    const req = httpMock.expectOne('/api/promotions');
    req.flush(mockResponse);

    expect(component.promotions).toEqual(mockResponse.data.data);
  });

  it('should filter membres correctly', () => {
    component.membres = [
      { guildUsername: 'John Doe', status: 'active', communityRole: 'Member' },
      { guildUsername: 'Jane Smith', status: 'inactive', communityRole: 'Admin' },
      { guildUsername: 'Bob Johnson', status: 'active', communityRole: 'Moderator' }
    ];

    component.searchTerm = 'john';
    component.filterMembres();

    expect(component.filteredMembres).toEqual([
      { guildUsername: 'John Doe', status: 'active', communityRole: 'Member' },
      { guildUsername: 'Bob Johnson', status: 'active', communityRole: 'Moderator' }
    ]);
  });

  it('should show all membres when no search term', () => {
    component.membres = [
      { guildUsername: 'John Doe', status: 'active' },
      { guildUsername: 'Jane Smith', status: 'inactive' }
    ];

    component.searchTerm = '';
    component.filterMembres();

    expect(component.filteredMembres).toEqual(component.membres);
  });

  it('should handle search input', () => {
    spyOn(component, 'filterMembres');
    const event = { target: { value: 'test search' } } as any;

    component.onSearch(event);

    expect(component.searchTerm).toBe('test search');
    expect(component.filterMembres).toHaveBeenCalled();
  });

  it('should refresh membres', () => {
    spyOn(component, 'loadGuildBlocks');
    component.refreshMembres();

    expect(component.loadGuildBlocks).toHaveBeenCalled();
  });

  it('should open edit pseudo modal', () => {
    const mockMember = { uuid: 'member1', guildUsername: 'user1' };
    component.openEditPseudoModal(mockMember);

    expect(component.showEditPseudoModal).toBe(true);
    expect(component.editingMembre).toEqual(mockMember);
    expect(component.editPseudoForm.get('guildUsername')?.value).toBe('user1');
  });

  it('should close edit pseudo modal', () => {
    component.showEditPseudoModal = true;
    component.closeEditPseudoModal();

    expect(component.showEditPseudoModal).toBe(false);
    expect(component.editingMembre).toBeNull();
  });

  it('should submit edit pseudo successfully', () => {
    const mockMember = { uuidMember: 'member1' };
    component.editingMembre = mockMember;
    component.editPseudoForm.patchValue({ guildUsername: 'newUsername' });
    component.submitting = false;

    component.submitEditPseudo();

    expect(component.submitting).toBe(true);

    const req = httpMock.expectOne(`/api/members/${mockMember.uuidMember}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ guildUsername: 'newUsername' });
    req.flush({ success: true });

    // Gérer la requête de rechargement des guilds
    const reloadReq = httpMock.expectOne('/api/guilds');
    reloadReq.flush([]);

    expect(component.submitting).toBe(false);
    expect(component.showEditPseudoModal).toBe(false);
  });

  it('should open edit promos modal', () => {
    const mockMember = { uuidMember: 'member1', followedPromotions: [{ uuid: 1, name: 'Promo 1' }] };
    component.openEditPromosModal(mockMember);

    expect(component.showEditPromosModal).toBe(true);
    expect(component.editingMembre).toEqual(mockMember);
    expect(component.editPromosForm.get('followedPromotions')?.value).toEqual([1]);
  });

  it('should close edit promos modal', () => {
    component.showEditPromosModal = true;
    component.closeEditPromosModal();

    expect(component.showEditPromosModal).toBe(false);
    expect(component.editingMembre).toBeNull();
  });

  it('should submit edit promos successfully', () => {
    const mockMember = { uuidMember: 'member1' };
    component.editingMembre = mockMember;
    component.editPromosForm.patchValue({ followedPromotions: [1, 2] });
    component.submitting = false;

    component.submitEditPromos();

    expect(component.submitting).toBe(true);

    const req = httpMock.expectOne(`/api/members/${mockMember.uuidMember}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ followedPromotions: [1, 2] });
    req.flush({ success: true });

    // Gérer la requête de rechargement des guilds
    const reloadReq = httpMock.expectOne('/api/guilds');
    reloadReq.flush([]);

    expect(component.submitting).toBe(false);
    expect(component.showEditPromosModal).toBe(false);
  });

  it('should refresh discord user successfully', () => {
    const mockMember = { uuidDiscord: '123456789', uuidGuild: 'guild1' };
    component.refreshDiscordUser(mockMember);

    const req = httpMock.expectOne(`/api/discord-users/${mockMember.uuidDiscord}/refresh`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ uuidGuild: mockMember.uuidGuild });
    req.flush({ success: true });

    // Gérer la requête de rechargement des guilds
    const reloadReq = httpMock.expectOne('/api/guilds');
    reloadReq.flush([]);
  });

  it('should refresh all discord users successfully', () => {
    component.membres = [
      { uuidDiscord: '123456789', uuidGuild: 'guild1' },
      { uuidDiscord: '987654321', uuidGuild: 'guild2' }
    ];
    
    // Mock de la méthode pour éviter les problèmes avec toPromise()
    spyOn(component, 'loadGuildBlocks');
    component.refreshAllDiscordUsers();

    // Gérer les requêtes de refresh pour chaque membre
    const req1 = httpMock.expectOne('/api/discord-users/123456789/refresh');
    req1.flush({ success: true });
    const req2 = httpMock.expectOne('/api/discord-users/987654321/refresh');
    req2.flush({ success: true });

    // Vérifier que loadGuildBlocks a été appelé
    expect(component.loadGuildBlocks).toHaveBeenCalled();
  });

  it('should open edit roles modal', () => {
    const mockMember = { uuidGuild: 'guild1', roles: [{ id: 1, name: 'Role 1' }] };
    const mockRoles = [
      { id: 1, name: 'Role 1' },
      { id: 2, name: 'Role 2' }
    ];

    component.openEditRolesModal(mockMember);

    expect(component.showEditRolesModal).toBe(true);
    expect(component.editingRoles).toEqual(mockMember);

    const req = httpMock.expectOne(`/api/guilds/${mockMember.uuidGuild}/discord-roles`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRoles);

    expect(component.allDiscordRoles).toEqual(mockRoles);
  });

  it('should close edit roles modal', () => {
    component.showEditRolesModal = true;
    component.closeEditRolesModal();

    expect(component.showEditRolesModal).toBe(false);
    expect(component.editingRoles).toBeNull();
  });

  it('should toggle discord role successfully', () => {
    const mockRole = { id: 1, name: 'Role 1' };
    const mockMember = { uuidMember: 'member1', discordRoles: [] };
    component.editingRoles = mockMember;
    component.submittingRoleChange = false;

    component.toggleDiscordRole(mockRole, mockMember);

    expect(component.submittingRoleChange).toBe(true);

    const req = httpMock.expectOne(`/api/members/${mockMember.uuidMember}/add-discord-role/${mockRole.id}`);
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true });

    // Gérer la requête de rechargement des guilds
    const reloadReq = httpMock.expectOne('/api/guilds');
    reloadReq.flush([]);

    expect(component.submittingRoleChange).toBe(false);
  });

  it('should check if member has discord role', () => {
    const mockRole = { id: 1, name: 'Role 1' };
    const mockMember = { uuidMember: 'member1', discordRoles: [{ id: 1, name: 'Role 1' }] };

    expect(component.hasDiscordRole(mockRole, mockMember)).toBe(true);

    const mockMemberWithoutRole = { uuidMember: 'member1', discordRoles: [{ id: 2, name: 'Role 2' }] };
    expect(component.hasDiscordRole(mockRole, mockMemberWithoutRole)).toBe(false);
  });

  it('should open add member modal', () => {
    component.openAddMemberModal();

    expect(component.showAddMemberModal).toBe(true);
    expect(component.addMemberStep).toBe(1);
  });

  it('should close add member modal', () => {
    component.showAddMemberModal = true;
    component.closeAddMemberModal();

    expect(component.showAddMemberModal).toBe(false);
    expect(component.addMemberStep).toBe(1);
    expect(component.addMemberGuild).toBeNull();
    expect(component.addMemberSelectedDiscordUser).toBeNull();
  });

  it('should handle add member guild change', () => {
    const mockGuild = { uuidGuild: 'guild1', name: 'Guild 1' };
    const mockDiscordUsers = [
      { id: 1, username: 'user1' },
      { id: 2, username: 'user2' }
    ];

    component.addMemberGuild = mockGuild;
    component.onAddMemberGuildChange();

    const req = httpMock.expectOne(`/api/members/guild/${mockGuild.uuidGuild}/discord-users-available`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDiscordUsers);

    expect(component.addMemberDiscordUsers).toEqual(mockDiscordUsers);
    expect(component.addMemberDiscordUsers.length).toBe(2);
  });

  it('should handle add member discord user selection', () => {
    const mockUser = { id: 1, username: 'user1', displayName: 'User 1' };
    component.onAddMemberDiscordUserSelect(mockUser);

    expect(component.addMemberSelectedDiscordUser).toEqual(mockUser);
    expect(component.addMemberForm.get('guildUsername')?.value).toBe('User 1');
  });

  it('should submit discord user successfully', () => {
    const mockFormData = {
      uuidDiscord: '123456789',
      discordUsername: 'testuser',
      discriminator: '1234'
    };

    component.addDiscordUserForm.patchValue(mockFormData);
    component.addMemberSubmitting = false;

    component.submitDiscordUser();

    expect(component.addMemberSubmitting).toBe(true);

    const req = httpMock.expectOne('/api/discord-users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockFormData);
    req.flush({ success: true });

    expect(component.addMemberSubmitting).toBe(false);
    expect(component.addMemberStep).toBe(2);
  });

  it('should submit add member successfully', () => {
    const mockFormData = {
      guildUsername: 'testuser'
    };

    component.addMemberForm.patchValue(mockFormData);
    component.addMemberGuild = { uuidGuild: 'guild1' };
    component.addDiscordUserForm.patchValue({ uuidDiscord: '123456789' });
    component.addMemberSubmitting = false;

    component.submitAddMember();

    expect(component.addMemberSubmitting).toBe(true);

    const req = httpMock.expectOne('/api/members');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      uuidDiscord: '123456789',
      uuidGuild: 'guild1',
      guildUsername: 'sanitized_username'
    });
    req.flush({ success: true });

    // Gérer la requête de rechargement des guilds
    const reloadReq = httpMock.expectOne('/api/guilds');
    reloadReq.flush([]);

    expect(component.addMemberSubmitting).toBe(false);
    expect(component.showAddMemberModal).toBe(false);
  });

  it('should confirm delete member', () => {
    const mockMember = { uuidMember: 'member1', guildUsername: 'user1' };
    component.confirmDeleteMember(mockMember);

    expect(component.showDeleteMemberModal).toBe(true);
    expect(component.memberToDelete).toEqual(mockMember);
  });

  it('should close delete member modal', () => {
    component.showDeleteMemberModal = true;
    component.memberToDelete = { uuidMember: 'member1' };
    component.closeDeleteMemberModal();

    expect(component.showDeleteMemberModal).toBe(false);
    expect(component.memberToDelete).toBeNull();
  });

  it('should delete member successfully', () => {
    const mockMember = { uuidMember: 'member1', guildUsername: 'user1' };
    component.memberToDelete = mockMember;
    component.deletingMember = false;

    component.deleteMember();

    expect(component.deletingMember).toBe(true);

    const req = httpMock.expectOne(`/api/members/${mockMember.uuidMember}/full`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });

    // Gérer la requête de rechargement des guilds
    const reloadReq = httpMock.expectOne('/api/guilds');
    reloadReq.flush([]);

    expect(component.deletingMember).toBe(false);
    expect(component.showDeleteMemberModal).toBe(false);
  });
}); 