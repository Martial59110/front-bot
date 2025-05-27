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

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'guilds', component: GuildsComponent },
  { path: 'utilisateurs', component: UsersComponent },
  { path: 'campus', component: CampusComponent },
  { path: 'formations', component: FormationsComponent },
  { path: 'promos', component: PromosComponent },
  { path: 'membres', component: MembresComponent },
  { path: 'canaux', component: CanauxComponent },
  { path: 'identifications', component: IdentificationsComponent },
];
