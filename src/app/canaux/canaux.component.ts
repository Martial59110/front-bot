import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-canaux',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './canaux.component.html',
  styleUrl: './canaux.component.scss'
})
export class CanauxComponent implements OnInit {
  showModal = false;
  channels: any[] = [];
  loading = false;
  submitting = false;
  channelForm: FormGroup;
  guilds: any[] = [];
  channelTypes = [
    { value: 'text', label: 'Textuel' },
    { value: 'voice', label: 'Vocal' },
    { value: 'announcement', label: 'Annonce' },
    { value: 'forum', label: 'Forum' }
  ];

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.channelForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      uuidGuild: ['', Validators.required],
      channelPosition: [0, [Validators.required, Validators.min(0)]]
    });
  }

  private generateDiscordId(): string {
    // Génère un nombre entre 17 et 19 chiffres
    const min = Math.pow(10, 16); // 17 chiffres
    const max = Math.pow(10, 19) - 1; // 19 chiffres
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  ngOnInit() {
    this.loadChannels();
    this.loadGuilds();
  }

  loadChannels() {
    this.loading = true;
    this.http.get<any>('/api/channels').subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.channels = data;
        } else if (data && Array.isArray(data.data)) {
          this.channels = data.data;
        } else if (data && data.data && Array.isArray(data.data.data)) {
          this.channels = data.data.data;
        } else {
          this.channels = [];
        }
        this.loading = false;
      },
      error: () => { this.channels = []; this.loading = false; }
    });
  }

  loadGuilds() {
    this.http.get<any>('/api/guilds').subscribe(data => {
      if (Array.isArray(data)) {
        this.guilds = data;
      } else if (data && Array.isArray(data.data)) {
        this.guilds = data.data;
      } else if (data && data.data && Array.isArray(data.data.data)) {
        this.guilds = data.data.data;
      } else {
        this.guilds = [];
      }
    });
  }

  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; this.channelForm.reset(); }

  submitChannel() {
    if (this.channelForm.invalid) return;
    this.submitting = true;

    const formData = {
      ...this.channelForm.value,
      uuid: this.generateDiscordId()
    };

    this.http.post('/api/channels', formData).subscribe({
      next: () => { 
        this.submitting = false; 
        this.closeModal(); 
        this.loadChannels(); 
      },
      error: (error) => { 
        console.error('Erreur lors de la création du canal:', error);
        this.submitting = false; 
      }
    });
  }
}
