import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { LewisComponent } from './games/lewis/lewis.component';
import { AssociationsComponent } from './games/associations/associations.component';
import { TrivionComponent } from './games/trivion/trivion.component';
import { FamilyComponent } from './games/family/family.component';
import { ClockComponent } from './pages/clock/clock.component';
import { InfosComponent } from './pages/infos/infos.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'lewis', component: LewisComponent },
  { path: 'associations', component: AssociationsComponent },
  { path: 'trivion', component: TrivionComponent },
  { path: 'family', component: FamilyComponent },
  { path: 'clock', component: ClockComponent },
  { path: 'infos', component: InfosComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
