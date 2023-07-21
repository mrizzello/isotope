import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { MaterialModule } from './material.module';

import { AssociationsComponent } from './games/associations/associations.component';

import { HomeComponent } from './pages/home/home.component';
import { InfosComponent } from './pages/infos/infos.component';

import { StopwatchComponent } from './components/stopwatch/stopwatch.component';
import { ShowResultsComponent } from './components/show-results/show-results.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AssociationsComponent,
    InfosComponent,
    StopwatchComponent,
    ShowResultsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    MaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
