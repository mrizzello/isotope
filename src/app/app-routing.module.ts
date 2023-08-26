import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { LewisComponent } from './games/lewis/lewis.component';
import { ChargesComponent } from './games/charges/charges.component';
import { AssociationsComponent } from './games/associations/associations.component';
import { MemorionComponent } from './games/memorion/memorion.component';
import { TrivionComponent } from './games/trivion/trivion.component';
import { FamilyComponent } from './games/family/family.component';
import { ClockComponent } from './pages/clock/clock.component';
import { InfosComponent } from './pages/infos/infos.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'lewis', component: LewisComponent },
  { path: 'charges', component: ChargesComponent },
  { path: 'associations', component: AssociationsComponent },
  { path: 'memorion', component: MemorionComponent },
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
