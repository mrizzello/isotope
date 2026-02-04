import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { MaterialModule } from './material.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { SafeHtmlPipe } from './pipes/sanitize.pipe';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { IntroductionComponent } from './components/introduction/introduction.component';
import { StopwatchComponent } from './components/stopwatch/stopwatch.component';
import { ScoreStarsComponent } from './components/score-stars/score-stars.component';
import { ShowResultsComponent } from './components/show-results/show-results.component';

import { AssociationsComponent } from './games/associations/associations.component';
import { MemorionComponent } from './games/memorion/memorion.component';
import { TrivionComponent } from './games/trivion/trivion.component';
import { LewisComponent } from './games/lewis/lewis.component';
import { LewisStructureComponent } from './components/lewis-structure/lewis-structure.component';
import { FamilyComponent } from './games/family/family.component';
import { ChargesComponent } from './games/charges/charges.component';

import { HomeComponent } from './pages/home/home.component';
import { InfosComponent } from './pages/infos/infos.component';
import { ClockComponent } from './pages/clock/clock.component';
import { ScoresComponent } from './pages/scores/scores.component';
import { PictiochimieComponent } from './pages/pictiochimie/pictiochimie.component';
import { PictiochimieScoreComponent } from './pages/pictiochimie-score/pictiochimie-score.component';

@NgModule({
  declarations: [
    AppComponent,
    IntroductionComponent,
    StopwatchComponent,
    ScoreStarsComponent,
    ShowResultsComponent,
    SafeHtmlPipe,
    HomeComponent,
    LewisComponent,
    LewisStructureComponent,
    AssociationsComponent,
    MemorionComponent,
    TrivionComponent,
    FamilyComponent,
    ChargesComponent,
    ClockComponent,
    InfosComponent,
    ScoresComponent,
    PictiochimieComponent,
    PictiochimieScoreComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    MaterialModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
