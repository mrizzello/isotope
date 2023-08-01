import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { MaterialModule } from './material.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { SafeHtmlPipe } from './pipes/sanitize.pipe';

import { AppComponent } from './app.component';
import { IntroductionComponent } from './components/introduction/introduction.component';
import { StopwatchComponent } from './components/stopwatch/stopwatch.component';
import { ScoreStarsComponent } from './components/score-stars/score-stars.component';
import { ShowResultsComponent } from './components/show-results/show-results.component';

import { AssociationsComponent } from './games/associations/associations.component';
import { TrivionComponent } from './games/trivion/trivion.component';
import { LewisComponent } from './games/lewis/lewis.component';
import { LewisStructureComponent } from './components/lewis-structure/lewis-structure.component';
import { FamilyComponent } from './games/family/family.component';

import { HomeComponent } from './pages/home/home.component';
import { InfosComponent } from './pages/infos/infos.component';

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
    TrivionComponent,
    FamilyComponent,
    InfosComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    MaterialModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
