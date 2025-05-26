import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-campus',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './campus.component.html',
  styleUrl: './campus.component.scss'
})
export class CampusComponent implements OnInit {
  showModal = false;
  guilds: any[] = [];
  campusForm: FormGroup;
  loadingGuilds = false;
  submitting = false;
  campusList: any[] = [];
  filteredCampuses: any[] = [];
  loading = false;
  searchTerm: string = '';
  showEditModal = false;
  editingCampus: any = null;
  editCampusForm: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.campusForm = this.fb.group({
      name: ['', Validators.required],
      uuidGuild: ['', Validators.required]
    });
    this.editCampusForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadGuilds();
    this.loadCampuses();
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

  loadCampuses() {
    this.loading = true;
    this.http.get<any>('/api/campuses').subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.campusList = data;
        } else if (data && Array.isArray(data.data)) {
          this.campusList = data.data;
        } else if (data && data.data && Array.isArray(data.data.data)) {
          this.campusList = data.data.data;
        } else {
          this.campusList = [];
        }
        this.filterCampuses();
        this.loading = false;
      },
      error: () => { this.campusList = []; this.filterCampuses(); this.loading = false; }
    });
  }

  refreshCampuses() {
    this.loadCampuses();
  }

  filterCampuses() {
    if (!this.searchTerm) {
      this.filteredCampuses = this.campusList;
      return;
    }
    const search = this.searchTerm.toLowerCase();
    this.filteredCampuses = this.campusList.filter(campus => 
      campus.name.toLowerCase().includes(search) || 
      (campus.uuidGuild && campus.uuidGuild.toLowerCase().includes(search))
    );
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.filterCampuses();
  }

  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; this.campusForm.reset(); }

  submitCampus() {
    if (this.campusForm.invalid) return;
    this.submitting = true;
    this.http.post('/api/campuses', this.campusForm.value).subscribe({
      next: () => { this.submitting = false; this.closeModal(); this.loadCampuses(); },
      error: () => { this.submitting = false; }
    });
  }

  deleteCampus(campus: any) {
    if (!confirm(`Supprimer le campus "${campus.name}" ? Cette action est irréversible.`)) return;
    this.http.delete(`/api/campuses/${campus.uuidCampus}`).subscribe({
      next: () => this.loadCampuses(),
      error: () => {}
    });
  }

  openEditModal(campus: any) {
    this.editingCampus = campus;
    this.editCampusForm.patchValue({ name: campus.name });
    this.showEditModal = true;
  }
  closeEditModal() {
    this.showEditModal = false;
    this.editingCampus = null;
    this.editCampusForm.reset();
  }
  submitEditCampus() {
    if (this.editCampusForm.invalid || !this.editingCampus) return;
    const payload = { name: this.editCampusForm.value.name };
    this.http.put(`/api/campuses/${this.editingCampus.uuidCampus}`, payload).subscribe({
      next: () => { this.closeEditModal(); this.loadCampuses(); },
      error: () => {}
    });
  }
}
