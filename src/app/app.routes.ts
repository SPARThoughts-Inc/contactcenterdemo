import { Routes } from '@angular/router';
import { AgentinterfaceComponent } from './agentinterface/agentinterface.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component:  AgentinterfaceComponent},
];