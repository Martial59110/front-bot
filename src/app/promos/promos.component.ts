import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { debounceTime, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-promos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, FormsModule, DragDropModule],
  templateUrl: './promos.component.html',
  styleUrl: './promos.component.scss'
})
export class PromosComponent implements OnInit {
  promotions: any[] = [];
  loading = false;
  searchTerm: string = '';
  showModal = false;
  showEditModal = false;
  showPositionModal = false;
  editingPromo: any = null;
  selectedPromo: any = null;
  newPosition: number = 0;
  submitting = false;
  promoForm: FormGroup;
  editPromoForm: FormGroup;
  guilds: any[] = [];
  formations: any[] = [];
  asyncFormations: any[] = [];
  asyncFormationsTotal = 0;
  asyncFormationsPage = 1;
  asyncFormationsLimit = 5;
  formationTypeahead$ = new Subject<string>();
  lastFormationSearchTerm = '';
  showFormationModal = false;
  formationList: any[] = [];
  formationPage = 1;
  formationLimit = 5;
  formationTotal = 0;
  formationSearchTerm = '';
  selectedFormation: any = null;
  page = 1;
  limit = 10;
  totalPromotions = 0;
  showMembersModal = false;
  selectedPromoForMembers: any = null;
  promoMembers: any[] = [];
  allMembers: any[] = [];
  memberSearchTerm: string = '';
  filteredMembers: any[] = [];
  addingMember = false;
  removingMember = false;
  guildBlocks: { uuidGuild: string; guildName: string; promotions: any[]; memberCount: number }[] = [];
  memberPage = 1;
  memberLimit = 7;
  memberTotal = 0;
  promoMemberCounts: { [uuidGuild: string]: number } = {};

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.promoForm = this.fb.group({
      uuidGuild: ['', Validators.required],
      uuidFormation: ['', Validators.required],
      name: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      status: ['active', Validators.required]
    });
    this.editPromoForm = this.fb.group({
      name: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      status: ['active', Validators.required]
    });
  }

  ngOnInit() {
    this.loadPromotions(1);
    this.loadGuilds();
    this.formationTypeahead$.subscribe(term => this.searchFormationsAsync(term, 1));
  }

  loadGuilds() {
    this.http.get<any>('/api/guilds').subscribe({
      next: (data) => {
        this.guilds = Array.isArray(data) ? data : data.data;
      }
    });
  }

  getFormationsTotalPages() {
    return Math.max(1, Math.ceil(this.asyncFormationsTotal / this.asyncFormationsLimit));
  }
  loadPrevFormationsPage() {
    if (this.asyncFormationsPage > 1) {
      this.searchFormationsAsync(this.lastFormationSearchTerm, this.asyncFormationsPage - 1);
    }
  }
  loadNextFormationsPage() {
    if (this.asyncFormationsPage < this.getFormationsTotalPages()) {
      this.searchFormationsAsync(this.lastFormationSearchTerm, this.asyncFormationsPage + 1);
    }
  }

  searchFormationsAsync(search: string = '', page: number = 1) {
    this.lastFormationSearchTerm = search;
    const uuidGuild = this.promoForm.get('uuidGuild')?.value;
    let url = `/api/formations/lookup?page=${page}&limit=${this.asyncFormationsLimit}`;
    if (search && search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    this.http.get<any>(url).subscribe(res => {
      console.log('Résultat formations async', res);
      let formationsArr: any[] = [];
      if (Array.isArray(res.data?.data)) {
        formationsArr = res.data.data;
      } else if (Array.isArray(res.data)) {
        formationsArr = res.data;
      } else if (Array.isArray(res)) {
        formationsArr = res;
      }
      this.asyncFormations = formationsArr.filter((f: any) => !uuidGuild || f.uuidGuild === uuidGuild);
      this.asyncFormationsTotal = res.total || this.asyncFormations.length;
      this.asyncFormationsPage = page;
    });
  }

  onGuildSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    const uuidGuild = select.value;
    this.promoForm.patchValue({ uuidFormation: '' });
    this.asyncFormations = [];
    this.asyncFormationsTotal = 0;
    if (uuidGuild) {
      this.searchFormationsAsync('', 1);
    }
  }

  onFormationSearch(event: any) {
    const term = typeof event === 'string' ? event : event?.term || '';
    this.searchFormationsAsync(term, 1);
  }

  loadPromotions(page: number = this.page) {
    this.loading = true;
    let url = `/api/promotions?page=${page}&limit=${this.limit}`;
    if (this.searchTerm) {
      url += `&search=${encodeURIComponent(this.searchTerm)}`;
    }
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        if (response?.data?.data?.data) {
          const promos = response.data.data.data;
          // Grouper par guild
          const guildMap: { [uuidGuild: string]: any } = {};
          promos.forEach((promo: any) => {
            if (!guildMap[promo.uuidGuild]) {
              guildMap[promo.uuidGuild] = {
                uuidGuild: promo.uuidGuild,
                guildName: promo.guildName || promo.guild?.name || promo.uuidGuild,
                promotions: []
              };
            }
            guildMap[promo.uuidGuild].promotions.push(promo);
          });
          // Trier les promotions de chaque guild par position
          this.guildBlocks = Object.values(guildMap).map((block: any) => {
            block.promotions = block.promotions.sort((a: any, b: any) => {
              if (a.categoryPosition == null) return 1;
              if (b.categoryPosition == null) return -1;
              return a.categoryPosition - b.categoryPosition;
            });
            const guild = this.guilds.find(g => g.uuid === block.uuidGuild);
            block.memberCount = guild?.memberCount ?? 0;
            return block;
          });
          this.totalPromotions = promos.length;
        } else {
          this.guildBlocks = [];
          this.totalPromotions = 0;
        }
        this.page = page;
        this.loading = false;
      },
      error: () => { 
        this.guildBlocks = []; 
        this.loading = false; 
      }
    });
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.page = 1;
    this.loadPromotions(1);
  }

  openModal() {
    this.showModal = true;
    this.promoForm.reset({ status: 'active' });
    this.formations = [];
  }

  closeModal() {
    this.showModal = false;
    this.promoForm.reset();
    this.formations = [];
  }

  openEditModal(promo: any) {
    this.editingPromo = promo;
    this.editPromoForm.patchValue({
      name: promo.name,
      startDate: promo.startDate,
      endDate: promo.endDate,
      status: promo.status
    });
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingPromo = null;
    this.editPromoForm.reset();
  }

  openFormationModal() {
    if (!this.promoForm.get('uuidGuild')?.value) {
      alert('Veuillez d\'abord sélectionner un serveur Discord.');
      return;
    }
    this.formationPage = 1;
    this.formationSearchTerm = '';
    this.loadFormationsPage();
    this.showFormationModal = true;
  }

  closeFormationModal() {
    this.showFormationModal = false;
  }

  loadFormationsPage(page: number = this.formationPage, search: string = this.formationSearchTerm) {
    let url = `/api/formations?page=${page}&limit=${this.formationLimit}`;
    const uuidGuild = this.promoForm.get('uuidGuild')?.value;
    if (uuidGuild) url += `&uuidGuild=${encodeURIComponent(uuidGuild)}`;
    if (search && search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    this.http.get<any>(url).subscribe(res => {
      let dataArr: any[] = [];
      if (Array.isArray(res.data?.data)) {
        dataArr = res.data.data;
        this.formationTotal = res.data.total || dataArr.length;
      } else if (Array.isArray(res.data)) {
        dataArr = res.data;
        this.formationTotal = res.total || dataArr.length;
      } else if (Array.isArray(res)) {
        dataArr = res;
        this.formationTotal = res.length;
      }
      this.formationList = dataArr;
      this.formationPage = page;
      this.formationSearchTerm = search;
    });
  }

  selectFormation(formation: any) {
    this.selectedFormation = formation;
    this.promoForm.patchValue({ uuidFormation: formation.uuidFormation });
    this.closeFormationModal();
  }

  getFormationTotalPages() {
    return Math.max(1, Math.ceil(this.formationTotal / this.formationLimit));
  }

  submitPromo() {
    if (this.promoForm.invalid) return;
    const raw = this.promoForm.value;
    if (!raw.uuidFormation || raw.uuidFormation === 'undefined') {
      alert('Veuillez sélectionner une formation.');
      this.submitting = false;
      return;
    }
    this.submitting = true;
    const payload: any = {
      name: raw.name,
      startDate: raw.startDate,
      endDate: raw.endDate,
      uuidGuild: raw.uuidGuild,
      uuidFormation: this.selectedFormation?.uuidFormation || raw.uuidFormation,
      status: raw.status
    };
    console.log('Payload envoyé :', payload);
    this.http.post('/api/promotions', payload).subscribe({
      next: () => {
        this.submitting = false;
        this.closeModal();
        this.loadPromotions();
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  submitEditPromo() {
    if (this.editPromoForm.invalid || !this.editingPromo) return;
    this.submitting = true;
    this.http.patch(`/api/promotions/${this.editingPromo.uuid_promotion}`, this.editPromoForm.value).subscribe({
      next: () => {
        this.submitting = false;
        this.closeEditModal();
        this.loadPromotions();
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  deletePromo(promo: any) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) {
      this.http.delete(`/api/promotions/${promo.uuid_promotion}`).subscribe({
        next: () => this.loadPromotions(),
        error: () => alert('Erreur lors de la suppression de la promotion')
      });
    }
  }

  onFormationDropdownOpen() {
    if (this.asyncFormations.length === 0) {
      this.searchFormationsAsync('', 1);
    }
  }

  getTotalPages() {
    return Math.max(1, Math.ceil(this.totalPromotions / this.limit));
  }

  prevPage() {
    if (this.page > 1) {
      this.loadPromotions(this.page - 1);
    }
  }

  nextPage() {
    if (this.page < this.getTotalPages()) {
      this.loadPromotions(this.page + 1);
    }
  }

  openPositionModal(promo: any) {
    this.selectedPromo = promo;
    this.newPosition = promo.categoryPosition ?? 0;
    this.showPositionModal = true;
  }

  closePositionModal() {
    this.showPositionModal = false;
    this.selectedPromo = null;
    this.newPosition = 0;
  }

  updatePosition() {
    if (!this.selectedPromo || this.newPosition === undefined) return;
    this.submitting = true;
    const currentIndex = this.promotions.findIndex(p => p.uuid_promotion === this.selectedPromo.uuid_promotion);
    if (currentIndex === -1) return;
    moveItemInArray(this.promotions, currentIndex, this.newPosition);
    this.promotions.forEach((promo, idx) => {
      promo.categoryPosition = idx;
      this.http.patch(`/api/promotions/${promo.uuid_promotion}/position/${idx}`, {}).subscribe();
    });
    this.submitting = false;
    this.closePositionModal();
  }

  drop(event: CdkDragDrop<any[]>, block: any) {
    moveItemInArray(block.promotions, event.previousIndex, event.currentIndex);
    block.promotions.forEach((promo: any, idx: number) => {
      promo.categoryPosition = idx;
      this.http.patch(`/api/promotions/${promo.uuid_promotion}/position/${idx}`, {}).subscribe();
    });
  }

  getGuildName(uuidGuild: string): string {
    const guild = this.guilds.find(g => g.uuid === uuidGuild);
    return guild ? guild.name : uuidGuild;
  }

  openMembersModal(promo: any) {
    this.selectedPromoForMembers = promo;
    this.showMembersModal = true;
    this.memberPage = 1;
    this.memberSearchTerm = '';
    this.loadAvailableMembers();
    this.loadPromoMembers();
  }

  closeMembersModal() {
    this.showMembersModal = false;
    this.selectedPromoForMembers = null;
    this.promoMembers = [];
    this.allMembers = [];
    this.memberSearchTerm = '';
    this.filteredMembers = [];
  }

  getAvatarUrl(member: any): string {
    if (member.discordUser?.avatar && member.uuidDiscord) {
      return `https://cdn.discordapp.com/avatars/${member.uuidDiscord}/${member.discordUser.avatar}.png`;
    }
    return 'https://cdn.discordapp.com/embed/avatars/0.png';
  }

  loadAllMembers() {
    const uuidGuild = this.selectedPromoForMembers?.uuidGuild;
    let url = '/api/members';
    if (uuidGuild) url += `?uuidGuild=${encodeURIComponent(uuidGuild)}`;
    // On récupère aussi les discordUsers pour enrichir les membres
    Promise.all([
      this.http.get<any>(url).toPromise(),
      this.http.get<any>('/api/discord-users').toPromise()
    ]).then(([membersData, discordUsersData]) => {
      let members = Array.isArray(membersData.data) ? membersData.data : (membersData.data?.data || membersData.data || membersData);
      let discordUsers = Array.isArray(discordUsersData) ? discordUsersData : discordUsersData.data;
      this.allMembers = members.map((member: any) => {
        const discordUser = discordUsers.find((u: any) => u.uuidDiscord === member.uuidDiscord);
        return {
          ...member,
          discordAvatar: discordUser?.avatar || null
        };
      });
      this.filterMembers();
    }).catch(() => { this.allMembers = []; this.filterMembers(); });
  }

  loadPromoMembers() {
    if (!this.selectedPromoForMembers) return;
    this.http.get<any>(`/api/promotions/${this.selectedPromoForMembers.uuid_promotion}/members`)
      .subscribe({
        next: (response) => {
          this.promoMembers = Array.isArray(response) ? response : response.data;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des membres de la promotion:', err);
          this.promoMembers = [];
        }
      });
  }

  filterMembers() {
    const term = this.memberSearchTerm.toLowerCase();
    this.filteredMembers = this.allMembers.filter(m =>
      m.uuidGuild === this.selectedPromoForMembers?.uuidGuild &&
      !this.promoMembers.some(pm => pm.uuidMember === m.uuidMember) &&
      (m.displayName?.toLowerCase().includes(term) || m.username?.toLowerCase().includes(term) || m.uuidMember?.includes(term))
    );
  }

  onMemberSearchChange(term: string) {
    this.memberPage = 1;
    this.loadAvailableMembers(term);
  }

  loadAvailableMembers(search: string = '') {
    if (!this.selectedPromoForMembers) return;

    // Appel AVEC uuidGuild pour ne récupérer que les membres de la guilde de la promotion
    let url = `/api/members?uuidGuild=${this.selectedPromoForMembers.uuidGuild}&page=${this.memberPage}&limit=${this.memberLimit}&search=${encodeURIComponent(search)}`;
    this.http.get<any>(url)
      .subscribe({
        next: (response) => {
          const promoMemberIds = this.promoMembers.map(m => m.uuidMember);
          const allMembers = Array.isArray(response.data) ? response.data : (response.data?.data || []);
          this.filteredMembers = allMembers.filter((m: any) => !promoMemberIds.includes(m.uuidMember));
          this.memberTotal = response.total;
        },
        error: (err) => {
          this.filteredMembers = [];
          this.memberTotal = 0;
        }
      });
  }

  getMemberTotalPages(): number {
    return Math.ceil(this.memberTotal / this.memberLimit);
  }

  prevMemberPage() {
    if (this.memberPage > 1) {
      this.memberPage--;
      this.loadAvailableMembers(this.memberSearchTerm);
    }
  }

  nextMemberPage() {
    if (this.memberPage < this.getMemberTotalPages()) {
      this.memberPage++;
      this.loadAvailableMembers(this.memberSearchTerm);
    }
  }

  addMemberToPromo(member: any) {
    if (!this.selectedPromoForMembers) return;
    this.addingMember = true;
    this.http.post(`/api/promotions/${this.selectedPromoForMembers.uuid_promotion}/followers/${member.uuidMember}`, {}).subscribe({
      next: () => {
        this.addingMember = false;
        this.loadPromoMembers();
        this.filterMembers();
      },
      error: () => { this.addingMember = false; }
    });
  }

  removeMemberFromPromo(member: any) {
    if (!this.selectedPromoForMembers) return;
    this.removingMember = true;
    this.http.delete(`/api/promotions/${this.selectedPromoForMembers.uuid_promotion}/followers/${member.uuidMember}`).subscribe({
      next: () => {
        this.removingMember = false;
        this.loadPromoMembers();
        this.filterMembers();
      },
      error: () => { this.removingMember = false; }
    });
  }

  loadGuildBlocks() {
    this.http.get<any>('/api/guilds').subscribe({
      next: (guildsData) => {
        const guilds = Array.isArray(guildsData) ? guildsData : guildsData.data;
        this.guilds = guilds;
        this.guildBlocks = guilds.map((g: any) => ({
          uuidGuild: g.uuid,
          guildName: g.name,
          promotions: [],
          memberCount: g.memberCount ?? 0
        }));
        // Charger le nombre de membres associés à une promotion pour chaque guilde
        this.guildBlocks.forEach(block => this.loadPromoMemberCount(block.uuidGuild));
      }
    });
  }

  loadPromoMemberCount(uuidGuild: string) {
    this.http.get<any>(`/api/guilds/${uuidGuild}/promotion-members-count`).subscribe({
      next: (res) => {
        this.promoMemberCounts[uuidGuild] = res.count;
      },
      error: () => {
        this.promoMemberCounts[uuidGuild] = 0;
      }
    });
  }
}
