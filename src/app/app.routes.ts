import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './users/users.component';
import { PromosComponent } from './promos/promos.component';
import { MembresComponent } from './membres/membres.component';
import { CanauxComponent } from './canaux/canaux.component';
import { IdentificationsComponent } from './identifications/identifications.component';
import { CampusComponent } from './campus/campus.component';
import { GuildsComponent } from './guilds/guilds.component';
import { FormationsComponent } from './formations';
import { LoginComponent } from './auth/login/login.component';
import { CallbackComponent } from './auth/callback/callback.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Routes publiques (authentification)
  { path: 'login', component: LoginComponent },
  { path: 'auth-callback-page', component: CallbackComponent },
  
  // Routes protégées (nécessitent une authentification)
  { 
    path: '', 
    component: DashboardComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'guilds', 
    component: GuildsComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'utilisateurs', 
    component: UsersComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'campus', 
    component: CampusComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'formations', 
    component: FormationsComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'promos', 
    component: PromosComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'membres', 
    component: MembresComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'canaux', 
    component: CanauxComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'identifications', 
    component: IdentificationsComponent, 
    canActivate: [authGuard] 
  },
  
  // Redirection par défaut
  { path: '**', redirectTo: '' }
];
