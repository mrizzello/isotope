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
    "Vous êtes une superstar&nbsp;!<br />Que les succès d'aujourd'hui soient le début de vos réalisations de demain.",
    "Vous êtes admirable&nbsp;!<br />Vous êtes l'une des personnes les plus talentueuses que nous connaissons.",
    "Eblouissant&nbsp;!<br />C'était impressionnant de jouer avec vous&nbsp;!",
    "Epatant&nbsp;!<br />Quelle classe et quel panache&nbsp;!",
    "Vous êtes extraordinaire&nbsp;!<br />Si jamais je me fais tatouer, ça sera une photo de vous avec le pouce levé&nbsp;!",
    "Vous avez été fabuleux&nbsp;!<br />Si vous étiez un dinosaure, vous seriez un Legendasaurus Rex.",
    "Vous avez été fantastique&nbsp;!<br />Sans vous, la Terre serait un endroit sombre et ennuyeux.",
    "Vous êtes impressionnant&nbsp;!<br />Vous êtes la personnification de la perfection absolue.",
    "Magnifique&nbsp;!<br />Chez le coiffeur, les gens pointent du doigt vos cheveux et disent «comme ça».",
    "Vous êtes redoutable&nbsp;!<br />Vous avez vraiment des qualités extraordinaires. Bon travail.",
    "Vous êtes incroyable&nbsp;!<br />Je donnerai votre prénom à tous mes enfants, garçons ou filles.",
    "Merveilleux&nbsp;!<br />Je voterais pour vous pour l'élection de grand empereur de la Terre.",
    "Parfait&nbsp;!<br />Votre date de naissance devrait être une fête nationale... Avec des feux d'artifice&nbsp;!",
    "Vous êtes prodigieux&nbsp;!<br />Vous êtes plus la grande réalisation de l'Univers.",
    "Vous avez été sensationnel&nbsp;!<br />Lorsque le soleil se lève, c'est pour vous voir jouer.",
    "Vous avez été prodigieux&nbsp;!<br />Dans un combat à mains nues, vous pourriez battre deux requins, un ours et cinq canards.",
    "Vous avez été splendide&nbsp;!<br />Un jour, on écrira des opéras au sujet de vos exploits&nbsp;!",
    "Vous êtes admirable&nbsp;!<br />David Beckham aimerait être aussi populaire que vous&nbsp;!",
    "Eblouissant&nbsp;!<br />Vous êtes tellement brillant que les extra-terrestres vous observent en secret.",
    "Au concours de la personne la plus sympatique,<br />vous remportez la première place sans efforts&nbsp;!",
    "Grâce à vous, les situations<br />les plus banales deviennent un vrai spectacle.",
    "Vous devriez être payé(e) pour votre habilité à jouer&nbsp;!",
    "Vous devriez ouvrir une pharmacie<br />car vous êtes un remède pour la mauvaise humeur&nbsp;!",
    "Quel plaisir&nbsp;!<br />Vous répandez la joie à chaque fois que vous jouez&nbsp;!",
    "Vous êtes tellement génial(e)&nbsp;!<br />Vous devriez déposer un brevet pour votre personnalité&nbsp;!",
    "Vous êtes magnifique&nbsp;!<br />Votre radieuse présence illumine n'importe quelle pièce&nbsp;!",
    "On a besoin de plus de personnes comme vous&nbsp;!<br />Vous êtes une véritable bouffée d'air."
  ];
}
