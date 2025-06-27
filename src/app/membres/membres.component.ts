import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { CustomValidators } from '../shared/validators/custom.validators';
import { SanitizationService } from '../shared/services/sanitization.service';

@Component({
  selector: 'app-membres',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, FormsModule],
  templateUrl: './membres.component.html',
  styleUrl: './membres.component.scss'
})
export class MembresComponent implements OnInit {
  membres: any[] = [];
  filteredMembres: any[] = [];
  loading = false;
  searchTerm: string = '';

  showEditPseudoModal = false;
  showEditPromosModal = false;
  editingMembre: any = null;
  editPseudoForm: FormGroup;
  editPromosForm: FormGroup;
  promotions: any[] = [];
  submitting = false;

  discordUsers: any[] = [];

  guildBlocks: {
    uuidGuild: string;
    guildName: string;
    membres: any[];
    searchTerm: string;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalMembres: number;
    loading: boolean;
  }[] = [];

  showEditRolesModal = false;
  editingRoles: any = null;
  allDiscordRoles: any[] = [];
  submittingRoleChange = false;

  totalMembres = 0;

  showAddMemberModal = false;
  addMemberGuild: any = null;
  addMemberDiscordUsers: any[] = [];
  addMemberSelectedDiscordUser: any = null;
  addMemberLoading = false;
  addMemberSubmitting = false;

  addMemberForm: FormGroup;
  addDiscordUserForm: FormGroup;
  addMemberStep = 1; // 1 = Discord User, 2 = Member

  showDeleteMemberModal = false;
  deletingMember = false;
  memberToDelete: any = null;

  constructor(
    private http: HttpClient, 
    private fb: FormBuilder,
    private sanitizationService: SanitizationService,
    private customValidators: CustomValidators
  ) {
    this.editPseudoForm = this.fb.group({
      guildUsername: ['', [Validators.required, this.customValidators.discordUsername()]]
    });

    this.editPromosForm = this.fb.group({
      followedPromotions: [[]]
    });

    this.addMemberForm = this.fb.group({
      guildUsername: ['', [Validators.required, this.customValidators.discordUsername()]]
    });

    this.addDiscordUserForm = this.fb.group({
      uuidDiscord: ['', [Validators.required, this.customValidators.discordId()]],
      discordUsername: ['', [Validators.required, this.customValidators.discordUsername()]],
      discriminator: ['', [Validators.required, this.customValidators.discordDiscriminator()]]
    });
  }

  ngOnInit() {
    this.loadGuildBlocks();
    this.loadPromotions();
  }

  loadGuildBlocks() {
    this.http.get<any>('/api/guilds').subscribe({
      next: (guildsData) => {
        const guilds = Array.isArray(guildsData) ? guildsData : guildsData.data;
        this.guildBlocks = guilds.map((g: any) => ({
          uuidGuild: g.uuid,
          guildName: g.name,
          membres: [],
          searchTerm: '',
          currentPage: 1,
          pageSize: 7,
          totalPages: 1,
          totalMembres: 0,
          loading: false
        }));
        this.guildBlocks.forEach(block => this.loadGuildMembers(block, 1, block.pageSize, ''));
      }
    });
  }

  loadGuildMembers(block: any, page: number = 1, limit: number = 7, searchTerm: string = '') {
    block.loading = true;
    this.http.get<any>(`/api/members?uuidGuild=${block.uuidGuild}&page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`)
      .subscribe(membersData => {
        let membres = Array.isArray(membersData.data) ? membersData.data : (membersData.data?.data || membersData.data || []);
        let total = membersData.total || (membersData.data && membersData.data.total) || membres.length;
        block.membres = membres;
        block.totalMembres = total;
        block.totalPages = Math.ceil(total / limit) || 1;
        block.currentPage = page;
        block.loading = false;
      }, () => {
        block.membres = [];
        block.totalMembres = 0;
        block.totalPages = 1;
        block.currentPage = 1;
        block.loading = false;
      });
  }

  prevGuildPage(block: any) {
    if (block.currentPage > 1) {
      this.loadGuildMembers(block, block.currentPage - 1, block.pageSize, block.searchTerm);
    }
  }

  nextGuildPage(block: any) {
    if (block.currentPage < block.totalPages) {
      this.loadGuildMembers(block, block.currentPage + 1, block.pageSize, block.searchTerm);
    }
  }

  onGuildSearch(block: any) {
    this.loadGuildMembers(block, 1, block.pageSize, block.searchTerm);
  }

  loadPromotions() {
    this.http.get<any>('/api/promotions').subscribe(data => {
      if (Array.isArray(data)) {
        this.promotions = data;
      } else if (data && Array.isArray(data.data)) {
        this.promotions = data.data;
      } else if (data && data.data && Array.isArray(data.data.data)) {
        this.promotions = data.data.data;
      } else {
        this.promotions = [];
      }
    });
  }

  filterMembres() {
    if (!this.searchTerm) {
      this.filteredMembres = this.membres;
      return;
    }
    const search = this.searchTerm.toLowerCase();
    this.filteredMembres = this.membres.filter(membre =>
      (membre.guildUsername && membre.guildUsername.toLowerCase().includes(search)) ||
      (membre.status && membre.status.toLowerCase().includes(search)) ||
      (membre.communityRole && membre.communityRole.toLowerCase().includes(search))
    );
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.filterMembres();
  }

  refreshMembres() {
    this.loadGuildBlocks();
  }

  getRolesString(membre: any): string {
    return membre.roles?.map((r: any) => r.name).join(', ') || '';
  }

  getPromosString(membre: any): string {
    return membre.followedPromotions?.map((p: any) => p.name).join(', ') || '';
  }

  getAvatarUrl(membre: any): string {
    if (membre.discordUser?.avatar && membre.uuidDiscord) {
      return `https://cdn.discordapp.com/avatars/${membre.uuidDiscord}/${membre.discordUser.avatar}.png`;
    }
    return 'https://cdn.discordapp.com/embed/avatars/0.png';
  }

  openEditPseudoModal(membre: any) {
    this.editingMembre = membre;
    this.editPseudoForm.patchValue({ guildUsername: membre.guildUsername });
    this.showEditPseudoModal = true;
  }

  closeEditPseudoModal() {
    this.showEditPseudoModal = false;
    this.editingMembre = null;
    this.editPseudoForm.reset();
  }

  submitEditPseudo() {
    if (this.editPseudoForm.invalid || !this.editingMembre) return;
    this.submitting = true;
    this.http.patch(`/api/members/${this.editingMembre.uuidMember}`, { guildUsername: this.editPseudoForm.value.guildUsername }).subscribe({
      next: () => { this.submitting = false; this.closeEditPseudoModal(); this.loadGuildBlocks(); },
      error: () => { this.submitting = false; }
    });
  }

  openEditPromosModal(membre: any) {
    this.editingMembre = membre;
    this.editPromosForm.patchValue({ followedPromotions: (membre.followedPromotions || []).map((p: any) => p.uuid) });
    this.showEditPromosModal = true;
  }

  closeEditPromosModal() {
    this.showEditPromosModal = false;
    this.editingMembre = null;
    this.editPromosForm.reset();
  }

  submitEditPromos() {
    if (this.editPromosForm.invalid || !this.editingMembre) return;
    this.submitting = true;
    this.http.patch(`/api/members/${this.editingMembre.uuidMember}`, { followedPromotions: this.editPromosForm.value.followedPromotions }).subscribe({
      next: () => { this.submitting = false; this.closeEditPromosModal(); this.loadGuildBlocks(); },
      error: () => { this.submitting = false; }
    });
  }

  refreshDiscordUser(membre: any) {
    this.http.put(`/api/discord-users/${membre.uuidDiscord}/refresh`, { uuidGuild: membre.uuidGuild }).subscribe({
      next: () => this.loadGuildBlocks(),
      error: () => alert('Erreur lors du rafraîchissement des infos Discord')
    });
  }

  refreshAllDiscordUsers() {
    this.loading = true;
    // On lance un refresh pour chaque membre avec uuidGuild
    const requests = this.membres.map(membre =>
      this.http.put(`/api/discord-users/${membre.uuidDiscord}/refresh`, { uuidGuild: membre.uuidGuild }).toPromise()
    );
    Promise.all(requests).then(() => {
      this.loadGuildBlocks();
    }).catch(() => {
      this.loading = false;
      alert('Erreur lors du rafraîchissement global des infos Discord');
    });
  }

  openEditRolesModal(membre: any) {
    this.editingRoles = membre;
    this.showEditRolesModal = true;
    // Charger tous les rôles Discord de la guilde (hors @everyone)
    this.http.get<any>(`/api/guilds/${membre.uuidGuild}/discord-roles`).subscribe({
      next: (roles) => {
        this.allDiscordRoles = Array.isArray(roles) ? roles : roles.data;
      },
      error: () => { this.allDiscordRoles = []; }
    });
  }

  closeEditRolesModal() {
    this.showEditRolesModal = false;
    this.editingRoles = null;
    this.allDiscordRoles = [];
  }

  toggleDiscordRole(role: any, membre: any) {
    this.submittingRoleChange = true;
    const hasRole = membre.discordRoles?.some((r: any) => r.id === role.id);
    const url = `/api/members/${membre.uuidMember}/${hasRole ? 'remove' : 'add'}-discord-role/${role.id}`;
    this.http.put(url, {}).subscribe({
      next: () => {
        this.loadGuildBlocks();
        this.submittingRoleChange = false;
      },
      error: () => { this.submittingRoleChange = false; }
    });
  }

  hasDiscordRole(role: any, membre: any): boolean {
    return !!membre.discordRoles?.some((r: any) => r.id === role.id);
  }

  openAddMemberModal() {
    this.showAddMemberModal = true;
    this.addMemberStep = 1;
    this.addMemberGuild = null;
    this.addMemberForm.reset({
      guildUsername: '',
      communityRole: 'Member',
      status: 'Active',
      xp: '0',
      level: 1
    });
    this.addDiscordUserForm.reset();
  }

  closeAddMemberModal() {
    this.showAddMemberModal = false;
    this.addMemberGuild = null;
    this.addMemberDiscordUsers = [];
    this.addMemberSelectedDiscordUser = null;
  }

  onAddMemberGuildChange() {
    if (!this.addMemberGuild) return;
    console.log('Guild sélectionnée:', this.addMemberGuild);
    this.addMemberLoading = true;
    const url = `/api/members/guild/${this.addMemberGuild.uuidGuild || this.addMemberGuild.uuid}/discord-users-available`;
    console.log('URL de la requête:', url);
    this.http.get<any>(url).subscribe({
      next: (users) => {
        console.log('Utilisateurs reçus:', users);
        this.addMemberDiscordUsers = users;
        this.addMemberLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.addMemberDiscordUsers = [];
        this.addMemberLoading = false;
        if (err.status === 504) {
          alert('Le serveur met trop de temps à répondre. Veuillez réessayer dans quelques instants.');
        } else {
          alert('Erreur lors du chargement des membres Discord : ' + (err?.error?.message || err.message || 'Erreur inconnue'));
        }
      }
    });
  }

  onAddMemberDiscordUserSelect(user: any) {
    this.addMemberSelectedDiscordUser = user;
    this.addMemberForm.patchValue({
      guildUsername: user.displayName || user.username
    });
  }

  submitDiscordUser() {
    if (this.addDiscordUserForm.invalid) return;
    this.addMemberSubmitting = true;
    this.http.post('/api/discord-users', this.addDiscordUserForm.value).subscribe({
      next: () => {
        this.addMemberStep = 2;
        this.addMemberSubmitting = false;
      },
      error: (err) => {
        this.addMemberSubmitting = false;
        alert('Erreur lors de l\'ajout de l\'utilisateur Discord : ' + (err?.error?.message || err.message || 'Erreur inconnue'));
      }
    });
  }

  submitAddMember() {
    if (this.addMemberForm.invalid || !this.addMemberGuild) return;
    this.addMemberSubmitting = true;
    const formData = {
      uuidDiscord: this.addDiscordUserForm.value.uuidDiscord,
      uuidGuild: this.addMemberGuild.uuidGuild,
      guildUsername: this.sanitizationService.sanitizeDiscordUsername(this.addMemberForm.value.guildUsername)
    };
    this.http.post('/api/members', formData).subscribe({
      next: () => {
        this.addMemberSubmitting = false;
        this.closeAddMemberModal();
        this.loadGuildBlocks();
      },
      error: (err) => {
        this.addMemberSubmitting = false;
        alert('Erreur lors de l\'ajout du membre : ' + (err?.error?.message || err.message || 'Erreur inconnue'));
      }
    });
  }

  confirmDeleteMember(membre: any) {
    this.memberToDelete = membre;
    this.showDeleteMemberModal = true;
  }

  closeDeleteMemberModal() {
    this.showDeleteMemberModal = false;
    this.memberToDelete = null;
  }

  deleteMember() {
    if (!this.memberToDelete) return;
    this.deletingMember = true;
    this.http.delete(`/api/members/${this.memberToDelete.uuidMember}/full`).subscribe({
      next: () => {
        this.deletingMember = false;
        this.closeDeleteMemberModal();
        this.loadGuildBlocks();
      },
      error: () => {
        this.deletingMember = false;
        alert('Erreur lors de la suppression du membre');
      }
    });
  }
}
