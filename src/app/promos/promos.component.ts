import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
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
  campuses: any[] = [];

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.promoForm = this.fb.group({
      uuidGuild: ['', Validators.required],
      uuidFormation: ['', Validators.required],
      name: ['', Validators.required],
      startDate: ['', [Validators.required, this.dateValidator()]],
      endDate: ['', [Validators.required, this.dateValidator()]],
      status: ['active', Validators.required],
      uuidCampus: ['', Validators.required]
    }, { validators: this.dateRangeValidator() });

    this.editPromoForm = this.fb.group({
      name: ['', Validators.required],
      startDate: ['', [Validators.required, this.dateValidator()]],
      endDate: ['', [Validators.required, this.dateValidator()]],
      status: ['active', Validators.required]
    }, { validators: this.dateRangeValidator() });
  }

  ngOnInit() {
    this.loadPromotions(1);
    this.loadGuilds();
    this.formationTypeahead$.subscribe(term => this.searchFormationsAsync(term, 1));
  }

  loadGuilds() {
    this.http.get<any>('/api/guilds').subscribe({
      next: (data) => {
        this.guilds = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
      },
      error: () => {
        this.guilds = [];
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
    
    this.http.get<any>(url).subscribe({
      next: (res) => {
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
      },
      error: () => {
        this.asyncFormations = [];
        this.asyncFormationsTotal = 0;
      }
    });
  }

  onGuildSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    const uuidGuild = select.value;
    console.log('Serveur sélectionné:', uuidGuild);
    
    this.promoForm.patchValue({ 
      uuidFormation: '',
      uuidCampus: '' // Réinitialiser aussi le campus
    });
    this.asyncFormations = [];
    this.asyncFormationsTotal = 0;
    
    // Charger les campus spécifiques au serveur
    if (uuidGuild) {
      console.log('Chargement des campus pour le serveur:', uuidGuild);
      this.http.get<any>(`/api/campuses?uuidGuild=${uuidGuild}`).subscribe({
        next: (data) => {
          console.log('Réponse API campus:', data);
          console.log('Contenu de data.data:', data.data);
          this.campuses = Array.isArray(data.data?.data) ? data.data.data : [];
          console.log('Campus chargés:', this.campuses);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des campus:', error);
          this.campuses = [];
        }
      });
      this.searchFormationsAsync('', 1);
    } else {
      console.log('Aucun serveur sélectionné, réinitialisation des campus');
      this.campuses = [];
    }
  }

  onFormationSearch(event: any) {
    const term = typeof event === 'string' ? event : event?.term || '';
    this.searchFormationsAsync(term, 1);
  }

  loadPromotions(page: number = this.page) {
    this.loading = true;
    this.guildBlocks = []; // Initialiser comme tableau vide
    let url = `/api/promotions?page=${page}&limit=${this.limit}`;
    if (this.searchTerm) {
      url += `&search=${encodeURIComponent(this.searchTerm)}`;
    }
  
    this.http.get<any>(url).subscribe({
      next: (response) => {
        try {
          console.log('Réponse API promotions:', response);
          
          // L'API backend retourne un wrapper : { message, data, statusCode }
          // Les promotions sont dans response.data.data
          let promos = [];
          if (response?.data?.data && Array.isArray(response.data.data)) {
            promos = response.data.data;
          } else if (response?.data && Array.isArray(response.data)) {
            promos = response.data;
          } else if (Array.isArray(response)) {
            promos = response;
          }
  
          console.log('Promotions extraites:', promos);
  
          // Grouper par guild
          const guildMap = new Map();
          promos.forEach((promo: any) => {
            if (!guildMap.has(promo.uuidGuild)) {
              guildMap.set(promo.uuidGuild, {
                uuidGuild: promo.uuidGuild,
                guildName: promo.guildName || promo.guild?.name || promo.uuidGuild,
                promotions: []
              });
            }

            // 🔍 Vérif debug
            console.log('Promo analysée :', promo);

            const guildEntry = guildMap.get(promo.uuidGuild);

            // ✅ Sécurité : on force promotions à un tableau si jamais c'est buggé
            if (!Array.isArray(guildEntry.promotions)) {
              guildEntry.promotions = [];
            }

            guildEntry.promotions.push(promo);
          });

          this.guildBlocks = Array.from(guildMap.values());
          this.totalPromotions = response.data?.total || promos.length;
          console.log('Guild blocks créés:', this.guildBlocks);
        } catch (error) {
          console.error('Erreur lors du traitement des données:', error);
          this.guildBlocks = [];
          this.totalPromotions = 0;
        }
        this.page = page;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des promotions:', error);
        this.guildBlocks = [];
        this.totalPromotions = 0;
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
    this.asyncFormations = [];
    this.selectedFormation = null;
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

    // Formatage des dates en ISO string avec timezone
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toISOString();
    };

    const payload = {
      name: raw.name,
      startDate: formatDate(raw.startDate),
      endDate: formatDate(raw.endDate),
      uuidGuild: raw.uuidGuild,
      uuidFormation: this.selectedFormation?.uuidFormation || raw.uuidFormation,
      status: raw.status,
      uuidCampus: raw.uuidCampus
    };

    console.log('Payload envoyé :', payload);
    this.http.post('/api/promotions', payload).subscribe({
      next: () => {
        this.submitting = false;
        this.closeModal();
        this.loadPromotions();
      },
      error: (error) => {
        console.error('Erreur lors de la création de la promotion:', error);
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
        this.loadAvailableMembers(this.memberSearchTerm);
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
        this.loadAvailableMembers(this.memberSearchTerm); 
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

  loadCampuses(uuidGuild: string) {
    if (!uuidGuild) {
      console.log('Aucun uuidGuild fourni pour le chargement des campus');
      this.campuses = [];
      return;
    }
    
    console.log('Chargement des campus pour le serveur:', uuidGuild);
    this.http.get<any>(`/api/campuses?uuidGuild=${uuidGuild}`).subscribe({
      next: (data) => {
        console.log('Réponse API campus:', data);
        console.log('Contenu de data.data:', data.data);
        this.campuses = Array.isArray(data.data?.data) ? data.data.data : [];
        console.log('Campus chargés:', this.campuses);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des campus:', error);
        this.campuses = [];
      }
    });
  }

  dateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const date = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(date.getTime())) {
        return { invalidDate: true };
      }

      if (date < today) {
        return { pastDate: true };
      }

      return null;
    };
  }

  dateRangeValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const startDate = formGroup.get('startDate')?.value;
      const endDate = formGroup.get('endDate')?.value;

      if (!startDate || !endDate) {
        return null;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        return { dateRange: true };
      }

      return null;
    };
  }
}
