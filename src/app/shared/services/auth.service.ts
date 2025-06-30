import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email: string;
}

export interface AuthResponse {
  user: DiscordUser;
  guilds: any[];
  allowedGuild: {
    isMember: boolean;
    roles: string[];
    nickname: string | null;
  };
  token: string | null;
  status: number;
}

export interface JwtPayload {
  sub: string;
  username: string;
  roles: string[];
  guildId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<DiscordUser | null>(null);
  private rolesSubject = new BehaviorSubject<string[]>([]);

  public currentUser$ = this.currentUserSubject.asObservable();
  public roles$ = this.rolesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Vérifier si un utilisateur est connecté au démarrage
    this.checkAuthStatus();
  }

  /**
   * Redirige vers Discord OAuth2
   */
  login(): void {
    window.location.href = '/api/auth/login';
  }

  /**
   * Traite le callback Discord et récupère les informations utilisateur
   */
  handleCallback(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`/api/auth/user-info`).pipe(
      tap(response => {
        if (response.user && response.allowedGuild.isMember) {
          this.setAuth(response.user, response.allowedGuild.roles);
        }
      })
    );
  }

  /**
   * Déconnecte l'utilisateur
   */
  logout(): void {
    // Appeler la route de déconnexion du backend qui supprime le cookie
    window.location.href = '/api/auth/logout';
  }

  /**
   * Vérifie si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(role: string): boolean {
    return this.rolesSubject.value.includes(role);
  }

  /**
   * Vérifie si l'utilisateur a au moins un des rôles spécifiés
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Récupère l'utilisateur actuel
   */
  getCurrentUser(): DiscordUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Récupère les rôles de l'utilisateur
   */
  getRoles(): string[] {
    return this.rolesSubject.value;
  }

  /**
   * Récupère les informations utilisateur depuis l'API
   */
  getUserInfo(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>('/api/auth/user-info').pipe(
      tap(response => {
        if (response.user && response.allowedGuild.isMember) {
          this.setAuth(response.user, response.allowedGuild.roles);
        }
      })
    );
  }

  /**
   * Stocke les informations d'authentification
   */
  private setAuth(user: DiscordUser, roles: string[]): void {
    this.currentUserSubject.next(user);
    this.rolesSubject.next(roles);
  }

  /**
   * Vérifie le statut d'authentification au démarrage
   */
  private checkAuthStatus(): void {
    this.getUserInfo().subscribe({
      next: (response) => {
        if (response.user && response.allowedGuild.isMember) {
          this.setAuth(response.user, response.allowedGuild.roles);
        }
      },
      error: (error) => {
        console.log('Aucun utilisateur connecté ou erreur d\'authentification:', error);
        // Pas besoin de rediriger, l'utilisateur sera redirigé par le guard si nécessaire
      }
    });
  }
} 