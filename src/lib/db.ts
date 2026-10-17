import fs from 'fs';
import path from 'path';
import { WordItem } from '@/types/word';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'words.json');
const VERCEL_FALLBACK_FILE = path.join('/tmp', 'words.json');

// In-memory fallback cache for serverless environments
let memoryWordsCache: WordItem[] | null = null;

const INITIAL_WORDS: WordItem[] = [
  {
    id: "word_1",
    word: "Serendipity",
    phonetic: "/ˌser.ənˈdɪp.ə.ti/",
    partOfSpeech: "noun",
    meaning: "The occurrence and development of events by chance in a happy, beneficial, or unexpectedly delightful way.",
    example: "Finding that vintage bookstore tucked away in the foggy alley was pure serendipity.",
    tags: ["delight", "destiny", "daily"],
    mastered: false,
    difficulty: "medium",
    createdAt: "2026-10-17T09:00:00.000Z",
    updatedAt: "2026-10-17T09:00:00.000Z"
  },
  {
    id: "word_2",
    word: "Petrichor",
    phonetic: "/ˈpet.rɪ.kɔːr/",
    partOfSpeech: "noun",
    meaning: "The pleasant, earthy scent produced when rain falls on dry soil after a long period of warm weather.",
    example: "She opened the glass balcony doors and inhaled the soothing petrichor of the afternoon drizzle.",
    tags: ["nature", "sensory", "rare"],
    mastered: true,
    difficulty: "hard",
    createdAt: "2026-10-17T09:10:00.000Z",
    updatedAt: "2026-10-17T09:10:00.000Z"
  },
  {
    id: "word_3",
    word: "Ephemeral",
    phonetic: "/ɪˈfem.ər.əl/",
    partOfSpeech: "adjective",
    meaning: "Lasting for only a very short time; fleeting, transient, and momentary.",
    example: "The golden glow of the autumn twilight was breathtaking yet ephemeral.",
    tags: ["time", "philosophy", "gre"],
    mastered: false,
    difficulty: "medium",
    createdAt: "2026-10-17T09:20:00.000Z",
    updatedAt: "2026-10-17T09:20:00.000Z"
  },
  {
    id: "word_4",
    word: "Sonder",
    phonetic: "/ˈsɒn.dər/",
    partOfSpeech: "noun",
    meaning: "The profound realization that every random stranger is living a life as vivid, intricate, and complex as your own.",
    example: "Looking out the train window at illuminated high-rise apartments filled him with a quiet sense of sonder.",
    tags: ["empathy", "mindset", "modern"],
    mastered: false,
    difficulty: "hard",
    createdAt: "2026-10-17T09:30:00.000Z",
    updatedAt: "2026-10-17T09:30:00.000Z"
  },
  {
    id: "word_5",
    word: "Mellifluous",
    phonetic: "/meˈlɪf.lu.əs/",
    partOfSpeech: "adjective",
    meaning: "Sweet or musical; pleasant to hear; smoothly flowing like honey.",
    example: "Her mellifluous voice captivated everyone in the quiet auditorium.",
    tags: ["sound", "elegance", "gre"],
    mastered: true,
    difficulty: "hard",
    createdAt: "2026-10-17T09:40:00.000Z",
    updatedAt: "2026-10-17T09:40:00.000Z"
  },
  {
    id: "word_6",
    word: "Ineffable",
    phonetic: "/ɪnˈef.ə.bəl/",
    partOfSpeech: "adjective",
    meaning: "Too great, sacred, or beautiful to be expressed or described in ordinary words.",
    example: "Standing atop the snow-capped peak at sunrise evoked an ineffable wonder.",
    tags: ["wonder", "transcendent", "gre"],
    mastered: false,
    difficulty: "medium",
    createdAt: "2026-10-17T09:50:00.000Z",
    updatedAt: "2026-10-17T09:50:00.000Z"
  }
];

function ensureLocalFileExists(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_WORDS, null, 2), 'utf-8');
    }
  } catch {
    // If running in read-only environment like Vercel edge/serverless
  }
}

export async function getWords(): Promise<WordItem[]> {
  ensureLocalFileExists();

  // Try reading fresh from project data file on disk first
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = await fs.promises.readFile(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryWordsCache = parsed;
        return parsed;
      }
    } catch (err) {
      console.warn('Failed reading DATA_FILE, attempting memory fallback:', err);
    }
  }

  // If memory cache exists (useful in serverless), use it
  if (memoryWordsCache && memoryWordsCache.length > 0) {
    return memoryWordsCache;
  }

  // Try /tmp fallback for serverless deployments
  if (fs.existsSync(VERCEL_FALLBACK_FILE)) {
    try {
      const content = await fs.promises.readFile(VERCEL_FALLBACK_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryWordsCache = parsed;
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  // Fallback to initial seed
  memoryWordsCache = [...INITIAL_WORDS];
  return memoryWordsCache;
}

export async function saveWords(words: WordItem[]): Promise<void> {
  memoryWordsCache = words;
  const jsonString = JSON.stringify(words, null, 2);

  let written = false;

  // Attempt local project directory write (works in local dev & traditional servers)
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    await fs.promises.writeFile(DATA_FILE, jsonString, 'utf-8');
    written = true;
  } catch (localErr) {
    console.warn('Could not write to local data path (typical in read-only serverless):', localErr);
  }

  // Attempt /tmp write (available in Vercel serverless functions)
  try {
    await fs.promises.writeFile(VERCEL_FALLBACK_FILE, jsonString, 'utf-8');
    written = true;
  } catch {
    // ignore
  }

  if (!written && !memoryWordsCache) {
    throw new Error('Failed to persist words to storage');
  }
}

export async function addWord(data: Omit<WordItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<WordItem> {
  const words = await getWords();
  const now = new Date().toISOString();
  const newWord: WordItem = {
    ...data,
    id: `word_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
    updatedAt: now
  };

  const updated = [newWord, ...words];
  await saveWords(updated);
  return newWord;
}

export async function updateWord(id: string, updates: Partial<Omit<WordItem, 'id' | 'createdAt'>>): Promise<WordItem | null> {
  const words = await getWords();
  const index = words.findIndex((w) => w.id === id);

  if (index === -1) {
    return null;
  }

  const updatedWord: WordItem = {
    ...words[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  words[index] = updatedWord;
  await saveWords(words);
  return updatedWord;
}

export async function deleteWord(id: string): Promise<boolean> {
  const words = await getWords();
  const filtered = words.filter((w) => w.id !== id);

  if (filtered.length === words.length) {
    return false;
  }

  await saveWords(filtered);
  return true;
}
