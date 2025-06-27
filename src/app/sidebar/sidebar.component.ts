import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, DiscordUser } from '../shared/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  isOpen = false;
  currentUser: DiscordUser | null = null;

  constructor(private authService: AuthService) {
    // S'abonner aux changements de l'utilisateur connecté
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleSidebar() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeSidebar() {
    this.isOpen = false;
    document.body.style.overflow = '';
  }

  logout() {
    this.authService.logout();
    this.closeSidebar();
  }

  getAvatarUrl(): string {
    if (this.currentUser?.avatar) {
      return `https://cdn.discordapp.com/avatars/${this.currentUser.id}/${this.currentUser.avatar}.png`;
    }
    return '/assets/default-avatar.png';
  }
}
