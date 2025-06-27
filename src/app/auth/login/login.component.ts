import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  isLoading = false;

  constructor(private authService: AuthService) {}

  /**
   * Lance le processus d'authentification Discord
   */
  loginWithDiscord(): void {
    this.isLoading = true;
    this.authService.login();
  }
} 