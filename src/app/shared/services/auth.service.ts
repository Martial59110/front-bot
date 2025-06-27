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
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private rolesSubject = new BehaviorSubject<string[]>([]);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();
  public roles$ = this.rolesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Vérifier si un token existe au démarrage
    this.loadStoredAuth();
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
  handleCallback(code: string): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`/api/auth/user-info?code=${code}`).pipe(
      tap(response => {
        if (response.token && response.allowedGuild.isMember) {
          this.setAuth(response.token, response.user, response.allowedGuild.roles);
        }
      })
    );
  }

  /**
   * Déconnecte l'utilisateur
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('user_roles');
    
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
    this.rolesSubject.next([]);
    
    this.router.navigate(['/login']);
  }

  /**
   * Vérifie si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
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
   * Récupère le token JWT actuel
   */
  getToken(): string | null {
    return this.tokenSubject.value;
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
   * Définit le token JWT (utilisé après le callback)
   */
  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
    this.tokenSubject.next(token);
  }

  /**
   * Récupère les informations utilisateur depuis l'API avec le token JWT
   */
  getUserInfo(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>('/api/auth/user-info').pipe(
      tap(response => {
        if (response.user && response.allowedGuild.isMember) {
          this.setAuth(this.getToken()!, response.user, response.allowedGuild.roles);
        }
      })
    );
  }

  /**
   * Stocke les informations d'authentification
   */
  private setAuth(token: string, user: DiscordUser, roles: string[]): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    localStorage.setItem('user_roles', JSON.stringify(roles));
    
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
    this.rolesSubject.next(roles);
  }

  /**
   * Charge les informations d'authentification stockées
   */
  private loadStoredAuth(): void {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('current_user');
    const rolesStr = localStorage.getItem('user_roles');

    if (token && userStr && rolesStr) {
      try {
        const user = JSON.parse(userStr);
        const roles = JSON.parse(rolesStr);
        
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);
        this.rolesSubject.next(roles);
      } catch (error) {
        console.error('Erreur lors du chargement des données d\'authentification:', error);
        this.logout();
      }
    }
  }
} 