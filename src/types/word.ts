export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'idiom'
  | 'phrase'
  | 'interjection'
  | 'other';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface WordItem {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech: PartOfSpeech;
  meaning: string;
  example: string;
  tags: string[];
  mastered: boolean;
  difficulty: DifficultyLevel;
  createdAt: string;
  updatedAt: string;
}

export interface WordInput {
  word: string;
  phonetic?: string;
  partOfSpeech: PartOfSpeech;
  meaning: string;
  example?: string;
  tags?: string[] | string;
  mastered?: boolean;
  difficulty?: DifficultyLevel;
}

export type ThemePreset =
  | 'manus-midnight'
  | 'quartz-light'
  | 'emerald-aurora'
  | 'cyberpunk-neon'
  | 'sunset-ember';
