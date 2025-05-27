import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-membres',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
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

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.editPseudoForm = this.fb.group({
      guildUsername: ['', Validators.required]
    });
    this.editPromosForm = this.fb.group({
      followedPromotions: [[]]
    });
  }

  ngOnInit() {
    this.loadMembres();
    this.loadPromotions();
  }

  loadMembres() {
    this.loading = true;
    this.http.get<any>('/api/members').subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.membres = data;
        } else if (data && Array.isArray(data.data)) {
          this.membres = data.data;
        } else if (data && data.data && Array.isArray(data.data.data)) {
          this.membres = data.data.data;
        } else {
          this.membres = [];
        }
        this.filterMembres();
        this.loading = false;
      },
      error: () => { this.membres = []; this.filterMembres(); this.loading = false; }
    });
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
    this.loadMembres();
  }

  getRolesString(membre: any): string {
    return membre.roles?.map((r: any) => r.name).join(', ') || '';
  }

  getPromosString(membre: any): string {
    return membre.followedPromotions?.map((p: any) => p.name).join(', ') || '';
  }

  getAvatarUrl(membre: any): string {
    if (membre.discordUser && membre.discordUser.avatar && membre.discordUser.uuidDiscord) {
      return `https://cdn.discordapp.com/avatars/${membre.discordUser.uuidDiscord}/${membre.discordUser.avatar}.png`;
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
      next: () => { this.submitting = false; this.closeEditPseudoModal(); this.loadMembres(); },
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
      next: () => { this.submitting = false; this.closeEditPromosModal(); this.loadMembres(); },
      error: () => { this.submitting = false; }
    });
  }
}
