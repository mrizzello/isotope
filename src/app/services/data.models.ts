export interface Element {
  n: string;
  name: string;
  symbol: string;
  m: string;
}

export interface Family {
  type: string;
  general: string;
  formule: string;
  name: string;
}

export interface Ion {
  symbol: string;
  charge: string;
  name: string;
  wrongNames: string[];
  group: string;
}

export interface Ions {
  cations: Ion[];
  anions: Ion[];
}

export interface Lewis {
  number: string;
  symbol: string;
  name: string;
  col: number;
}

export interface Pictiochimie {
  n: string;
  chapter: string;
  words: string[];
}

export interface Success {
  gifs: string[];
  phrases: string[];
}

export interface AppData {
  lewis: Lewis[];
  ions: Ions;
  success: Success;
  family: Family[];
  elements: Element[];
  pictiochimie: Pictiochimie[];
}
