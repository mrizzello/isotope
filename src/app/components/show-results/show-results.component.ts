import { Component, OnDestroy } from '@angular/core';
import { ShowResultsService } from '../../services/show-results.service';

@Component({
  selector: 'app-show-results',
  templateUrl: './show-results.component.html',
  styleUrls: ['./show-results.component.scss']
})
export class ShowResultsComponent {

  display: any = [];
  maxGifs = 19
  nGif = 0;

  constructor(private showResultsService: ShowResultsService) {
    this.showResultsService.display.subscribe((data: any) => {
      this.display.time = data.time !== undefined ? data.time : '';
      this.display.phrase = this.phrases[Math.floor(Math.random() * this.phrases.length)];
      this.nGif = Math.floor(Math.random() * (this.maxGifs - 1 + 1)) + 1;      
    });
  }

  public clickRestart() {
    this.showResultsService.clickRestart();
  };

  phrases = [
    "Vous êtes une superstar!<br />Que les succès d'aujourd'hui soient le début de vos réalisations de demain.",
    "Vous êtes admirable!<br />Vous êtes l'une des personnes les plus talentueuses que nous connaissons.",
    "Eblouissant!<br />C'était impressionnant de jouer avec vous!",
    "Epatant!<br />Quelle classe et quel panache!",
    "Vous êtes extraordinaire!<br />Si jamais je me fais tatouer, ça sera une photo de vous avec le pouce levé!",
    "Vous avez été fabuleux!<br />Si vous étiez un dinosaure, vous seriez un Legendasaurus Rex.",
    "Vous avez été fantastique!<br />Sans vous, la Terre serait un endroit sombre et ennuyeux.",
    "Vous êtes impressionnant!<br />Vous êtes la personnification de la perfection absolue.",
    "Magnifique!<br />Chez le coiffeur, les gens pointent du doigt vos cheveux et disent «comme ça».",
    "Vous êtes redoutable!<br />Vous avez vraiment des qualités extraordinaires. Bon travail.",
    "Vous êtes incroyable!<br />Je donnerai votre prénom à tous mes enfants, garçons ou filles.",
    "Merveilleux!<br />Je voterais pour vous pour l'élection de grand empereur de la Terre.",
    "Parfait!<br />Votre date de naissance devrait être une fête nationale... Avec des feux d'artifice!",
    "Vous êtes prodigieux!<br />Vous êtes plus la grande réalisation de l'Univers.",
    "Vous avez été sensationnel!<br />Lorsque le soleil se lève, c'est pour vous voir jouer.",
    "Vous avez été prodigieux!<br />Dans un combat à mains nues, vous pourriez battre deux requins, un ours et cinq canards.",
    "Vous avez été splendide!<br />Un jour, on écrira des opéras au sujet de vos exploits!",
    "Vous êtes admirable!<br />David Beckham aimerait être aussi populaire que vous!",
    "Eblouissant!<br />Vous êtes tellement brillant que les extra-terrestres vous observent en secret."
  ];
}
