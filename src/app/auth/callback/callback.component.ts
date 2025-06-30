import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="callback-card">
        <div class="loading-spinner" *ngIf="isLoading">
          <div class="spinner"></div>
          <p>Authentification en cours...</p>
        </div>
        
        <div class="error-message" *ngIf="error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <h3>Erreur d'authentification</h3>
          <p>{{ error }}</p>
          <button class="retry-btn" (click)="retry()">Réessayer</button>
        </div>
        
        <div class="success-message" *ngIf="success">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <h3>Connexion réussie !</h3>
          <p>Redirection vers le dashboard...</p>
        </div>
      </div>
    </div>
  `,
  styleUrl: './callback.component.scss'
})
export class CallbackComponent implements OnInit {
  isLoading = true;
  error: string | null = null;
  success = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.handleCallback();
  }

  private handleCallback(): void {
    // Récupérer les paramètres depuis l'URL
    this.route.queryParams.subscribe(params => {
      const success = params['success'];
      const error = params['error'];
      const message = params['message'];

      if (error || message) {
        this.isLoading = false;
        this.error = message || 'Une erreur est survenue lors de l\'authentification.';
        return;
      }

      if (!success) {
        this.isLoading = false;
        this.error = 'Paramètre de succès manquant.';
        return;
      }

      // Le token est maintenant dans un cookie httpOnly, on peut directement récupérer les informations utilisateur
      this.authService.getUserInfo().subscribe({
        next: (userInfo) => {
          this.isLoading = false;
          
          if (userInfo.allowedGuild.isMember) {
            this.success = true;
            // Rediriger vers le dashboard après un court délai
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 2000);
          } else {
            this.error = 'Vous devez être membre du serveur Discord Simplon pour accéder à cette application.';
            this.authService.logout();
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Erreur lors de la récupération des informations utilisateur:', err);
          this.error = 'Erreur lors de l\'authentification. Veuillez réessayer.';
          this.authService.logout();
        }
      });
    });
  }

  retry(): void {
    this.isLoading = true;
    this.error = null;
    this.authService.login();
  }
} 