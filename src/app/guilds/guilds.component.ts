import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-guilds',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './guilds.component.html',
  styleUrl: './guilds.component.scss'
})
export class GuildsComponent implements OnInit {
  showModal = false;
  guilds: any[] = [];
  filteredGuilds: any[] = [];
  guildForm: FormGroup;
  loading = false;
  submitting = false;
  searchTerm: string = '';

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.guildForm = this.fb.group({
      uuid: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadGuilds();
  }

  loadGuilds() {
    this.loading = true;
    this.http.get<any>('/api/guilds').subscribe({
      next: (data) => {
        this.guilds = Array.isArray(data) ? data : (data?.data || []);
        this.filterGuilds();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  filterGuilds() {
    if (!this.searchTerm) {
      this.filteredGuilds = this.guilds;
      return;
    }

    const search = this.searchTerm.toLowerCase();
    this.filteredGuilds = this.guilds.filter(guild => 
      guild.name.toLowerCase().includes(search) || 
      guild.uuid.toLowerCase().includes(search)
    );
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.filterGuilds();
  }

  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; this.guildForm.reset(); }

  submitGuild() {
    if (this.guildForm.invalid) return;
    this.submitting = true;

    // Appel à l'API pour créer la guilde
    this.http.post('/api/guilds', {
      uuid: this.guildForm.value.uuid,
      name: "Nouveau serveur",
      memberCount: "0",
      configuration: {}
    }).subscribe({
      next: () => {
        // Une fois créé, on fait le setup
        this.http.post(`/api/guilds/${this.guildForm.value.uuid}/setup`, {}).subscribe({
          next: () => {
            this.submitting = false;
            this.closeModal();
            this.loadGuilds();
          },
          error: (error) => {
            console.error('Erreur lors du setup de la guilde:', error);
            this.submitting = false;
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors de la création de la guilde:', error);
        this.submitting = false;
      }
    });
  }

  deleteGuild(guild: any) {
    if (!confirm(`Supprimer le serveur "${guild.name}" ? Cette action est irréversible.`)) return;
    this.http.delete(`/api/guilds/${guild.uuid}`).subscribe({
      next: () => this.loadGuilds(),
      error: () => {}
    });
  }

  refreshMembers() {
    if (this.guilds.length === 0) {
      this.loadGuilds();
      return;
    }

    this.loading = true;
    const updatePromises = this.guilds.map(guild => 
      this.http.post(`/api/guilds/${guild.uuid}/setup`, {}).toPromise()
    );

    Promise.all(updatePromises)
      .then(() => {
        this.loadGuilds();
      })
      .catch(error => {
        console.error('Erreur lors de la mise à jour des membres:', error);
        this.loading = false;
      });
  }
}
