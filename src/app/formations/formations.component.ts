import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-formations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule, DragDropModule, NgSelectModule],
  templateUrl: './formations.component.html',
  styleUrl: './formations.component.scss'
})
export class FormationsComponent implements OnInit {
  showModal = false;
  guilds: any[] = [];
  formationForm: FormGroup;
  loadingGuilds = false;
  submitting = false;
  formationList: any[] = [];
  filteredFormations: any[] = [];
  loading = false;
  searchTerm: string = '';
  showEditModal = false;
  editingFormation: any = null;
  editFormationForm: FormGroup;
  channels: any[] = [];
  forumThreads: { [forumId: string]: string[] } = {};
  newThreadName: { [forumId: string]: string } = {};

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.formationForm = this.fb.group({
      name: ['', Validators.required],
      uuidGuild: ['', Validators.required],
      channelIds: [[]],
      threads: [[]]
    });
    this.editFormationForm = this.fb.group({
      name: ['', Validators.required],
      channelIds: [[]]
    });
  }

  ngOnInit() {
    this.loadGuilds();
    this.loadFormations();
    this.loadChannels();
  }

  loadGuilds() {
    this.loadingGuilds = true;
    this.http.get<any>('/api/guilds').subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.guilds = data;
        } else if (data && Array.isArray(data.data)) {
          this.guilds = data.data;
        } else {
          this.guilds = [];
        }
        this.loadingGuilds = false;
      },
      error: () => { this.loadingGuilds = false; }
    });
  }

  loadFormations() {
    this.loading = true;
    this.http.get<any>('/api/formations').subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.formationList = data;
        } else if (data && Array.isArray(data.data)) {
          this.formationList = data.data;
        } else if (data && data.data && Array.isArray(data.data.data)) {
          this.formationList = data.data.data;
        } else {
          this.formationList = [];
        }
        this.filterFormations();
        this.loading = false;
      },
      error: () => { this.formationList = []; this.filterFormations(); this.loading = false; }
    });
  }

  loadChannels() {
    this.http.get<any>('/api/channels').subscribe(data => {
      let channels = [];
      if (Array.isArray(data)) {
        channels = data;
      } else if (data && Array.isArray(data.data)) {
        channels = data.data;
      } else if (data && data.data && Array.isArray(data.data.data)) {
        channels = data.data.data;
      }
      // Ajout du nom de catégorie lisible
      const categoryMap: { [key: string]: string } = {};
      channels.forEach((ch: any) => {
        if (ch.categoryName && ch.uuidCategory) {
          categoryMap[ch.uuidCategory] = ch.categoryName;
        }
      });
      this.channels = channels.map((ch: any) => ({
        ...ch,
        categoryName: ch.categoryName || categoryMap[ch.uuidCategory] || 'Sans catégorie'
      }));
    });
  }

  getGuildName(uuidGuild: string): string {
    const guild = this.guilds.find(g => g.uuid === uuidGuild);
    return guild ? guild.name : uuidGuild;
  }

  refreshFormations() {
    this.loadFormations();
  }

  filterFormations() {
    if (!this.searchTerm) {
      this.filteredFormations = this.formationList;
      return;
    }
    const search = this.searchTerm.toLowerCase();
    this.filteredFormations = this.formationList.filter(formation => 
      formation.name.toLowerCase().includes(search) || 
      (formation.uuidGuild && this.getGuildName(formation.uuidGuild).toLowerCase().includes(search))
    );
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.filterFormations();
  }

  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; this.formationForm.reset(); this.forumThreads = {}; this.newThreadName = {}; }

  get selectedForumChannels() {
    const selectedIds = this.formationForm.get('channelIds')?.value || [];
    return this.channels.filter(c => selectedIds.includes(c.uuid) && c.type === 'forum');
  }

  addThread(forumId: string) {
    if (!this.newThreadName[forumId] || !this.newThreadName[forumId].trim()) return;
    if (!this.forumThreads[forumId]) this.forumThreads[forumId] = [];
    this.forumThreads[forumId].push(this.newThreadName[forumId].trim());
    this.newThreadName[forumId] = '';
    this.updateThreadsInForm();
  }

  removeThread(forumId: string, idx: number) {
    if (this.forumThreads[forumId]) {
      this.forumThreads[forumId].splice(idx, 1);
      this.updateThreadsInForm();
    }
  }

  updateThreadsInForm() {
    const threads = Object.entries(this.forumThreads).flatMap(([forumId, names]) =>
      names.map(name => ({ name, forumId }))
    );
    this.formationForm.get('threads')?.setValue(threads);
  }

  submitFormation() {
    if (this.formationForm.invalid) return;
    this.submitting = true;
    this.http.post('/api/formations', this.formationForm.value).subscribe({
      next: () => { this.submitting = false; this.closeModal(); this.loadFormations(); },
      error: () => { this.submitting = false; }
    });
  }

  deleteFormation(formation: any) {
    if (!confirm(`Supprimer la formation "${formation.name}" ? Cette action est irréversible.`)) return;
    this.http.delete(`/api/formations/${formation.uuidFormation}`).subscribe({
      next: () => this.loadFormations(),
      error: () => {}
    });
  }

  openEditModal(formation: any) {
    this.editingFormation = formation;
    this.editFormationForm.patchValue({
      name: formation.name,
      channelIds: (formation.channels || []).map((c: any) => c.uuid)
    });
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingFormation = null;
    this.editFormationForm.reset();
  }

  submitEditFormation() {
    if (this.editFormationForm.invalid || !this.editingFormation) return;
    const payload = {
      name: this.editFormationForm.value.name,
      channelIds: this.editFormationForm.value.channelIds
    };
    this.http.patch(`/api/formations/${this.editingFormation.uuidFormation}`, payload).subscribe({
      next: () => { this.closeEditModal(); this.loadFormations(); },
      error: () => {}
    });
  }

  getThreadsForForum(formation: any, forumId: string) {
    const threads = (formation.threads || []).filter((t: any) => t.forumId === forumId);
    // Suppression des doublons par nom
    const unique = threads.filter((t: any, i: number, arr: any[]) => arr.findIndex(x => x.name === t.name) === i);
    // Tri par position
    return unique.sort((a: any, b: any) => (a.threadPosition ?? 0) - (b.threadPosition ?? 0));
  }

  reorderChannels(formation: any, event: CdkDragDrop<any[]>) {
    moveItemInArray(formation.channels, event.previousIndex, event.currentIndex);
    // Met à jour la position localement
    formation.channels.forEach((ch: any, idx: number) => ch.channelPosition = idx);
    formation._channelsOrderChanged = true;
  }

  saveChannelsOrder(formation: any) {
    const payload = formation.channels.map((ch: any, idx: number) => ({ uuid: ch.uuid, channelPosition: idx }));
    this.http.patch(`/api/formations/${formation.uuidFormation}/channels-order`, { channels: payload }).subscribe({
      next: () => { formation._channelsOrderChanged = false; this.loadFormations(); },
      error: () => { formation._channelsOrderChanged = false; }
    });
  }

  // Drag & drop threads dans un forum
  reorderThreads(formation: any, forumId: string, event: CdkDragDrop<any[]>) {
    const threads = this.getThreadsForForum(formation, forumId);
    moveItemInArray(threads, event.previousIndex, event.currentIndex);
    // Met à jour la position localement
    threads.forEach((t: any, idx: number) => t.threadPosition = idx);
    // Trie le tableau local pour l'affichage immédiat
    threads.sort((a: any, b: any) => (a.threadPosition ?? 0) - (b.threadPosition ?? 0));
    if (!formation._threadsOrderChanged) formation._threadsOrderChanged = {};
    formation._threadsOrderChanged[forumId] = true;
  }

  saveThreadsOrder(formation: any, forumId: string) {
    const threads = this.getThreadsForForum(formation, forumId);
    const payload = threads.map((t: any, idx: number) => ({ uuid: t.uuid, threadPosition: idx }));
    this.http.patch(`/api/formations/${formation.uuidFormation}/threads-order`, { threads: payload }).subscribe({
      next: () => { if (formation._threadsOrderChanged) formation._threadsOrderChanged[forumId] = false; this.loadFormations(); },
      error: () => { if (formation._threadsOrderChanged) formation._threadsOrderChanged[forumId] = false; }
    });
  }

  getSortedChannels(formation: any) {
    const sorted = (formation.channels || []).slice().sort((a: any, b: any) => (a.channelPosition ?? 0) - (b.channelPosition ?? 0));
    console.log('Channels triés pour', formation.name, sorted.map((c: any) => `${c.name} (#${c.channelPosition})`));
    return sorted;
  }

  moveThreadUp(formation: any, forumId: string, idx: number) {
    const threads = this.getThreadsForForum(formation, forumId);
    if (idx > 0) {
      [threads[idx - 1], threads[idx]] = [threads[idx], threads[idx - 1]];
      threads.forEach((t: any, i: number) => t.threadPosition = i);
      if (!formation._threadsOrderChanged) formation._threadsOrderChanged = {};
      formation._threadsOrderChanged[forumId] = true;
    }
  }

  moveThreadDown(formation: any, forumId: string, idx: number) {
    const threads = this.getThreadsForForum(formation, forumId);
    if (idx < threads.length - 1) {
      [threads[idx + 1], threads[idx]] = [threads[idx], threads[idx + 1]];
      threads.forEach((t: any, i: number) => t.threadPosition = i);
      if (!formation._threadsOrderChanged) formation._threadsOrderChanged = {};
      formation._threadsOrderChanged[forumId] = true;
    }
  }

  getCategoryName(uuidCategory: string): string {
    if (!uuidCategory || uuidCategory === 'null' || uuidCategory === 'undefined') return 'Sans catégorie';
    const found = this.channels.find(c => c.uuidCategory === uuidCategory && c.categoryName);
    return found?.categoryName || 'Sans catégorie';
  }

  onChannelToggle(uuid: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const checked = input?.checked ?? false;
    const control = this.formationForm.get('channelIds');
    if (!control) return;
    let value = control.value || [];
    if (checked) {
      if (!value.includes(uuid)) value = [...value, uuid];
    } else {
      value = value.filter((id: string) => id !== uuid);
    }
    control.setValue(value);
    control.markAsDirty();
  }
} 