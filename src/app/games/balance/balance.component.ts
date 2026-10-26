import { Component, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';

import { IntroductionService } from '../../services/introduction.service';
import { ShowResultsService } from '../../services/show-results.service';
import { ScoresService } from '../../services/scores.service';

import {
  Action,
  Atom,
  DRAW_CONFIG,
  Equation,
  Level,
  Molecule,
  PlayerId,
  RoundState,
  apply,
  canPose,
  chooseAction,
  newRound,
  pickEquations,
  substanceIndex,
  substances
} from './balance.logic';

export const ROUNDS = 3;
const ATOM_SIZE = 20; // côté d'un atome en unités SVG
const ATOMS_PER_ROW = 4;
// au-delà de STACK_LIMIT molécules, la colonne garde la hauteur de STACK_LIMIT
// tuiles et les tuiles se chevauchent
const STACK_LIMIT = 4;
const STACK_GAP = 0.2; // écart entre tuiles en rem, cf. .substance dans le scss
const TUTORIAL_TURNS = 2; // nombre de tours du joueur guidés par le tutoriel, par match
const DISCARD_DURATION = 750; // durée de l'animation d'une molécule jetée, en ms (cf. scss)
const ATOM_GLYPHS: Record<Atom, { glyph: string; color: string }> = {
  T: { glyph: '▲', color: '#1e88e5' },
  C: { glyph: '●', color: '#e53935' },
  S: { glyph: '■', color: '#43a047' }
};

export interface AtomShape {
  atom: Atom;
  x: number; // centre
  y: number;
}

export interface MoleculeLayout {
  atoms: AtomShape[];
  viewBox: string;
  width: number; // en atomes, pour dimensionner la tuile
  rows: number;
}

@Component({
    selector: 'app-balance',
    templateUrl: './balance.component.html',
    styleUrls: ['./balance.component.scss'],
    animations: [
        trigger('slideInFromLeft', [
            transition(':enter', [
                style({ transform: 'translateX(-100%)' }),
                animate('300ms ease-out', style({ transform: 'translateX(0)' }))
            ])
        ]),
        trigger('slideInFromRight', [
            transition(':enter', [
                style({ transform: 'translateX(100%)' }),
                animate('300ms ease-out', style({ transform: 'translateX(0)' }))
            ])
        ])
    ],
    standalone: false
})
export class BalanceComponent implements OnDestroy {
  showIntroduction: boolean = true;
  showGame: boolean = false;
  showResults: boolean = false;
  disableClick: boolean = false;

  level: Level = 1;
  equations: Equation[] = [];
  roundIndex: number = 0;
  roundWins: Record<PlayerId, number> = { human: 0, algo: 0 };
  roundWinners: (PlayerId | null)[] = []; // gagnant de chaque manche, null tant qu'elle n'est pas jouée
  state: RoundState | null = null;
  roundOver: boolean = false;

  selected: number | null = null; // molécule sélectionnée dans la main du joueur
  refused: number | null = null; // substance qui vient de refuser une pose
  flash: { substance: number; player: PlayerId } | null = null;
  statusText: string = '';
  roundMessage: string = ''; // fin de manche, affichée dans la table de jeu
  humanMoves: number = 0; // coups joués par le joueur depuis le début du match
  discarding: { player: PlayerId; handIndex: number } | null = null; // molécule en train d'être jetée
  algoDelay: number = 1000;
  rounds: number = ROUNDS;
  handAtomSize: number = 1.5; // taille d'un atome dans les mains, en rem

  private layouts = new Map<Molecule, MoleculeLayout>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private startSubscription: Subscription | undefined;
  private restartSubscription: Subscription | undefined;

  constructor(
    private introductionService: IntroductionService,
    private showResultsService: ShowResultsService,
    private scoresService: ScoresService
  ) {
    this.startSubscription = this.introductionService.getStart().subscribe((data: any) => {
      if (typeof data === 'number') {
        this.level = data as Level;
      }
      this.start();
    });
    this.introductionService.updateDisplay({
      icon: 'balance',
      title: 'Balance',
      p: [
        '<b>Équilibrez l\'équation avant le robot&nbsp;!</b>',
        'Chaque tuile est une molécule&nbsp;: on ne peut pas la modifier, seulement en ajouter '
        + 'des copies.',
        'À votre tour, faites une seule action&nbsp;: <b>poser</b> une molécule de votre main '
        + 'sur la substance identique, ou <b>jeter</b> une molécule de votre main à la poubelle. '
        + 'Une molécule posée ne peut plus être retirée.',
        'Le premier à obtenir les <b>plus petits coefficients</b> qui équilibrent l\'équation gagne '
        + 'la manche. Le match se joue en 3 manches.'
      ],
      action: 'Niveau du robot',
      choices: [
        { label: 'Niveau 1', value: 1 },
        { label: 'Niveau 2', value: 2 },
        { label: 'Niveau 3', value: 3 }
      ]
    });
    this.restartSubscription = this.showResultsService.getRestart().subscribe(() => {
      this.start();
    });
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.restartSubscription?.unsubscribe();
    this.startSubscription?.unsubscribe();
  }

  get substanceList(): Molecule[] {
    return this.state ? substances(this.state.equation) : [];
  }

  // une entrée par molécule posée sur la substance, au moins une pour l'emplacement vide
  copies(substance: number): number[] {
    return [...Array(Math.max(1, this.state ? this.state.coefs[substance] : 0)).keys()];
  }

  // décalage vertical (rem) de chaque tuile après la première : négatif quand
  // la colonne dépasse STACK_LIMIT molécules, pour qu'elles se chevauchent
  stackOffset(substance: number, molecule: Molecule): number {
    const count = this.state ? this.state.coefs[substance] : 0;
    if (count <= STACK_LIMIT) {
      return 0;
    }
    // hauteur d'une tuile : atomes (1,1 rem par ligne) + padding + bordure, 2,5 rem au minimum
    const height = Math.max(2.5, this.layout(molecule).rows * 1.1 + 0.85);
    const column = STACK_LIMIT * height + (STACK_LIMIT - 1) * STACK_GAP;
    const step = (column - height) / (count - 1);
    return step - height - STACK_GAP;
  }

  get showTutorial(): boolean {
    return this.humanMoves < TUTORIAL_TURNS && this.humanCanPlay();
  }

  get isLastRound(): boolean {
    return this.roundIndex + 1 >= ROUNDS;
  }

  get reactantCount(): number {
    return this.state ? this.state.equation.reactants.length : 0;
  }

  layout(molecule: Molecule): MoleculeLayout {
    let layout = this.layouts.get(molecule);
    if (!layout) {
      const cols = Math.min(molecule.length, ATOMS_PER_ROW);
      const rows = Math.ceil(molecule.length / ATOMS_PER_ROW);
      const atoms = molecule.split('').map((atom, i) => {
        const row = Math.floor(i / ATOMS_PER_ROW);
        // la dernière ligne, si incomplète, est centrée
        const inRow = Math.min(ATOMS_PER_ROW, molecule.length - row * ATOMS_PER_ROW);
        const offset = (cols - inRow) * ATOM_SIZE / 2;
        return {
          atom: atom as Atom,
          x: offset + (i % ATOMS_PER_ROW + 0.5) * ATOM_SIZE,
          y: (row + 0.5) * ATOM_SIZE
        };
      });
      layout = { atoms, viewBox: '0 0 ' + cols * ATOM_SIZE + ' ' + rows * ATOM_SIZE, width: cols, rows };
      this.layouts.set(molecule, layout);
    }
    return layout;
  }

  trianglePoints(shape: AtomShape): string {
    const r = ATOM_SIZE * 0.42;
    return [
      [shape.x, shape.y - r],
      [shape.x + r * 0.95, shape.y + r * 0.75],
      [shape.x - r * 0.95, shape.y + r * 0.75]
    ].map((p) => p.join(',')).join(' ');
  }

  intro() {
    this.clearTimers();
    this.showIntroduction = true;
    this.showGame = false;
    this.showResults = false;
  }

  start() {
    this.clearTimers();
    this.equations = pickEquations(ROUNDS);
    this.roundIndex = 0;
    this.roundWins = { human: 0, algo: 0 };
    this.roundWinners = Array(ROUNDS).fill(null);
    this.humanMoves = 0;
    this.showIntroduction = false;
    this.showGame = true;
    this.showResults = false;
    this.startRound();
  }

  startRound() {
    const first: PlayerId = Math.random() < 0.5 ? 'human' : 'algo';
    this.state = newRound(this.equations[this.roundIndex], first, DRAW_CONFIG[this.level].proportionEquation);
    this.roundOver = false;
    this.roundMessage = '';
    this.resetSelection();
    this.flash = null;
    this.statusText = first === 'human' ? 'Tu commences&nbsp;!' : 'Le robot commence.';
    this.nextTurn();
  }

  nextRound() {
    if (!this.isLastRound) {
      this.roundIndex++;
      this.startRound();
    } else {
      this.end();
    }
  }

  // la molécule sélectionnée peut être posée sur cette substance (sans
  // indication visuelle : reconnaître un leurre fait partie de l'exercice)
  isTarget(substance: number): boolean {
    return this.state !== null && this.selected !== null
      && substanceIndex(this.state.equation, this.state.hands.human[this.selected]) === substance;
  }

  selectHand(index: number) {
    if (!this.humanCanPlay()) {
      return;
    }
    this.selected = this.selected === index ? null : index;
  }

  get tableActive(): boolean {
    return this.humanCanPlay() && this.selected !== null;
  }

  selectSubstance(substance: number) {
    // table inactive tant qu'aucune molécule de la main n'est sélectionnée
    if (!this.tableActive || !this.state || this.selected === null) {
      return;
    }
    const formula = this.formula(this.substanceList[substance]);
    if (!this.isTarget(substance)) {
      this.refuse(substance, 'Cette molécule ne correspond pas à ' + formula + '.');
    } else if (!canPose(this.state.equation, this.state.coefs, this.substanceList[substance])) {
      // pose en trop refusée : le joueur rejoue
      this.refuse(substance, 'Il y a déjà assez de ' + formula + ' : choisis une autre action.');
    } else {
      this.play({ type: 'pose', handIndex: this.selected });
    }
  }

  // seules les molécules de la main vont à la poubelle ; sans sélection,
  // un clic sur la poubelle jette directement la tuile de la main
  discard() {
    if (!this.humanCanPlay()) {
      return;
    }
    this.play({ type: 'jeter', handIndex: this.selected ?? 0 });
  }

  formula(molecule: Molecule): string {
    return molecule.split('').map((atom) => {
      const { glyph, color } = ATOM_GLYPHS[atom as Atom];
      return '<span style="color:' + color + '">' + glyph + '</span>';
    }).join('');
  }

  private humanCanPlay(): boolean {
    return !this.disableClick && !this.roundOver && this.state?.current === 'human';
  }

  private refuse(substance: number, message: string) {
    this.refused = substance;
    this.statusText = message;
    this.later(() => this.refused = null, 400);
  }

  private resetSelection() {
    this.selected = null;
    this.refused = null;
  }

  // un jet est d'abord animé, puis appliqué ; une pose est appliquée aussitôt
  private play(action: Action) {
    if (!this.state) {
      return;
    }
    if (action.type === 'jeter') {
      this.discarding = { player: this.state.current, handIndex: action.handIndex };
      this.disableClick = true;
      this.resetSelection();
      this.later(() => {
        this.discarding = null;
        this.commit(action);
      }, DISCARD_DURATION);
      return;
    }
    this.commit(action);
  }

  private commit(action: Action) {
    if (!this.state) {
      return;
    }
    const player = this.state.current;
    const molecule = this.state.hands[player][action.handIndex];
    if (player === 'human') {
      this.humanMoves++;
    }
    this.state = apply(this.state, action);
    this.resetSelection();

    const who = player === 'human' ? 'Tu' : 'Le robot';
    const verb = action.type === 'pose' ? (player === 'human' ? 'poses' : 'pose')
      : (player === 'human' ? 'jettes' : 'jette');
    this.statusText = who + ' ' + verb + ' ' + this.formula(molecule) + '.';
    this.flash = action.type === 'jeter' ? null
      : { substance: substanceIndex(this.state.equation, molecule), player };

    if (this.state.winner) {
      this.roundWins[this.state.winner]++;
      this.roundWinners[this.roundIndex] = this.state.winner;
      this.roundOver = true;
      this.roundMessage = this.state.winner === 'human'
        ? 'Équation équilibrée&nbsp;: tu gagnes la manche&nbsp;!'
        : 'Équation équilibrée&nbsp;: le robot gagne la manche.';
      return;
    }
    this.nextTurn();
  }

  private nextTurn() {
    if (this.state?.current === 'algo') {
      this.disableClick = true;
      this.later(() => this.algoPlay(), this.algoDelay);
    } else {
      this.disableClick = false;
    }
  }

  private algoPlay() {
    if (!this.state || this.state.current !== 'algo') {
      return;
    }
    this.play(chooseAction(this.state, this.level));
  }

  private later(fn: () => void, delay: number) {
    this.timers.push(setTimeout(fn, delay));
  }

  private clearTimers() {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    this.discarding = null;
    this.disableClick = false;
  }

  end() {
    this.showGame = false;
    this.showResults = true;
    const human = this.roundWins.human;
    const algo = this.roundWins.algo;

    // bilan cumulé des matchs, affiché sur la page des scores
    // (3 manches toujours jouées et sans nul : pas d'égalité possible)
    const record = this.scoresService.getItem('balanceRecord') || { won: 0, lost: 0 };
    if (human > algo) {
      record.won++;
    } else {
      record.lost++;
    }
    this.scoresService.setItem('balanceRecord', record);

    let display: any = [];
    display.title = human > algo ? 'Victoire&nbsp;!' : 'Petite défaite…';
    display.bestScoreText = human > algo ? 'Une victoire supplémentaire&nbsp;!' : 'Vous ne perdez rien de votre charme&nbsp;!';
    display.forceBestScore = true;
    display.game = 'balance';
    display.points = human;
    display.scores = [
      { label: 'Robot', value: algo, css: 'algo' },
      { label: 'Joueur', value: human, css: 'human' }
    ];
    this.showResultsService.updateDisplay(display);
  }

}
