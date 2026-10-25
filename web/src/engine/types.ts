// Shared contract between content, engine and UI.
// Change a shape here only together with every consumer.

/** Local calendar date, "YYYY-MM-DD". Never a timestamp. */
export type LocalDate = string;

export type TopicId =
  | 'locks-and-keys'
  | 'talking-computers'
  | 'scams-and-fakes'
  | 'your-phone'
  | 'internet-talk'
  | 'how-the-internet-works'
  | 'money-on-your-phone'
  | 'old-tech';

/** topic order for dailies and lessons. */
export const TOPIC_ORDER: TopicId[] = [
  'locks-and-keys',
  'talking-computers',
  'scams-and-fakes',
  'your-phone',
  'internet-talk',
  'how-the-internet-works',
  'money-on-your-phone',
];

export type Speaker = 'floyd' | 'bud';

export interface Source {
  name: string;
  url: string;
}

export interface Decoy {
  term: string;
  meaning: string;
  source_urls: string[];
}

export interface ExchangeLine {
  speaker: Speaker;
  /** Floyd lines only. */
  tone?: 'right' | 'neutral' | 'friendly';
  text: string;
  link_urls?: string[];
}

export type Difficulty = 1 | 2 | 3;

/** A daily term, a Pass the Phone extra (ptp-1, ptp-2) or an Old Tech item. */
export interface TermItem {
  id: string;
  kind: 'term';
  topic: TopicId;
  term: string;
  meaning: string;
  clues: [string, string, string, string, string];
  assumes: string[];
  decoys: [Decoy, Decoy, Decoy];
  exchange: ExchangeLine[];
  old_tech: boolean;
  sources: Source[];
  checked_on: LocalDate | null;
  difficulty: Difficulty;
  decisive_clue: Difficulty;
  /** Day number the item first becomes visible (Old Tech, lessons). Dailies use their schedule day. */
  release_day?: number;
}

export interface LessonCard {
  text: string;
  mascot: Speaker;
  line: string;
}

export interface LessonCheck {
  prompt: string;
  options: string[];
  answer: string;
  why: string;
}

/** worked lesson JSON. */
export interface Lesson {
  id: string;
  topic: TopicId;
  /** 1-based position inside its topic. */
  number: number;
  title: string;
  cards: LessonCard[];
  checks: LessonCheck[];
  takeaway: string;
  sources: Source[];
  checked_on: LocalDate | null;
  /** Defaults to `number`. */
  release_day?: number;
}

export interface ScheduleDay {
  date: LocalDate;
  /** TermItem id. */
  term: string;
  rerun: boolean;
}

/** schedule file. */
export interface Schedule {
  version: number;
  days: ScheduleDay[];
}

/** miss lines. `needs_clue` lines wait while Next clue is off. */
export interface MissLine {
  text: string;
  needs_clue?: boolean;
}

export interface MissLines {
  either: MissLine[];
  floyd: MissLine[];
}

/** Everything the app ships, loaded from /content/bundle.json. */
export interface ContentBundle {
  version: number;
  items: Record<string, TermItem>;
  lessons: Lesson[];
  /** Old Tech item ids in their fixed order. */
  oldTech: string[];
  /** ptp-1 and ptp-2. */
  ptpExtras: string[];
  schedule: Schedule;
  missLines: MissLines;
  commonWords: string[];
}

// ---------------------------------------------------------------------------
// Saved state. Stored as JSON under `jargle:v1`, `jargle:demo:judge`,
// `jargle:demo:new`.

export type RoundMode = 'daily' | 'practice' | 'oldtech' | 'ptp';
export type RoundStatus = 'playing' | 'solved' | 'learned';

export interface RoundRecord {
  item_id: string;
  mode: RoundMode;
  started_on: LocalDate;
  /** Clues shown, 1..5. */
  k: number;
  /** Missed decoy terms, in order. */
  spent: string[];
  selected: string | null;
  status: RoundStatus;
  /** 0 reveal, 1 share, 2 done card. */
  post_step: number;
  miss_line: string | null;
  replay: boolean;
  finished_on?: LocalDate;
  /** Bars left at the end; derived but frozen when the round ends. */
  end_bars?: number;
  /** Day number the round counts for, if it counted. */
  counted_day?: number;
  /** Clue count when the one non-ending miss happened. */
  miss_k?: number;
  /** Who says miss_line. */
  miss_speaker?: Speaker;
}

export interface LessonRecord {
  card: number;
  answers: string[];
  finished_on: LocalDate | null;
}

export interface PtpSet {
  id: number;
  /** Item ids for rounds 1..4. */
  rounds: string[];
  /** Current round, 1..4. */
  r: number;
  /** True once round 4 has finished. */
  done?: boolean;
}

export type BadgeId =
  | 'first-word'
  | 'week-one'
  | 'days-30'
  | 'days-60'
  | 'first-lesson'
  | 'floyds-student'
  | 'taught-someone';

export type TextSize = 'normal' | 'large' | 'largest';

export interface Settings {
  textSize: TextSize;
  sound: boolean;
  reducedMotion: boolean;
}

export interface SaveState {
  v: 1;
  /** Keys: `d:{day}` for dailies, item id for other solo rounds, `ptp:{set}:{r}`. */
  rounds: Record<string, RoundRecord>;
  ptpSet: PtpSet | null;
  /** {N}: words played together on this phone. */
  ptpTotal: number;
  /** {M}: best set, rounds solved with 3+ bars left. */
  ptpBest: number;
  firstPlayDay: number | null;
  /** item id -> due dates. */
  review: Record<string, LocalDate[]>;
  /** Review answers today: item id -> last session date answered. */
  reviewSeen: Record<string, LocalDate>;
  lessons: Record<string, LessonRecord>;
  badges: Partial<Record<BadgeId, LocalDate>>;
  /** Next miss line index per speaker. */
  missLineIndex: { floyd: number; bud: number };
  settings: Settings;
  flags: {
    firstRoundDone: boolean;
    textSizeAsked: boolean;
    inAppNoteHidden: boolean;
    persistAsked: boolean;
  };
  // Progress history. Kept apart from round records because a replay
  // overwrites its record, and a progress code has no records to load.
  /** Day numbers whose daily counted (Days learned). */
  countedDays?: number[];
  /** Day numbers whose daily was finished solo, counted or not. */
  finishedDays?: number[];
  /** Item ids finished solo (Home, Practice, Old Tech). */
  soloDone?: string[];
  /** Item id -> last date it was finished on this phone, in any mode. */
  lastFinished?: Record<string, LocalDate>;
  /** Miss lines still to say this cycle, as indexes, per speaker. */
  missLineQueue?: { floyd: number[]; bud: number[] };
}
