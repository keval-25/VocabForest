import fs from 'fs';
import path from 'path';
import { WordItem } from '@/types/word';
import { getMongoWordsCollection, isMongoConfigured } from './mongodb';
import { isBlobConfigured, getWordsFromBlob, saveWordsToBlob } from './blob';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'words.json');
const VERCEL_FALLBACK_FILE = path.join('/tmp', 'words.json');

// In-memory fallback cache for serverless environments
let memoryWordsCache: WordItem[] | null = null;

function readLocalSeedWords(): WordItem[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read local seed words from DATA_FILE:', err);
  }

  return [];
}

function ensureLocalFileExists(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const seeds = readLocalSeedWords();
      fs.writeFileSync(DATA_FILE, JSON.stringify(seeds, null, 2), 'utf-8');
    }
  } catch {
    // If running in read-only environment like Vercel edge/serverless
  }
}

async function getWordsFallback(): Promise<WordItem[]> {
  ensureLocalFileExists();

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

  if (memoryWordsCache && memoryWordsCache.length > 0) {
    return memoryWordsCache;
  }

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

  const seeds = readLocalSeedWords();
  memoryWordsCache = [...seeds];
  return memoryWordsCache;
}

async function saveWordsLocally(words: WordItem[]): Promise<void> {
  memoryWordsCache = words;
  const jsonString = JSON.stringify(words, null, 2);

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    await fs.promises.writeFile(DATA_FILE, jsonString, 'utf-8');
  } catch {
    // Read-only serverless environment
  }

  try {
    await fs.promises.writeFile(VERCEL_FALLBACK_FILE, jsonString, 'utf-8');
  } catch {
    // ignore
  }
}

/**
 * Fetch all words:
 * Priority 1: Vercel Blob (Cross-device shared cloud JSON storage)
 * Priority 2: MongoDB (if MONGODB_URI configured)
 * Priority 3: Local filesystem / memory cache fallback
 */
export async function getWords(): Promise<WordItem[]> {
  // 1. Vercel Blob Cloud Storage
  if (isBlobConfigured()) {
    try {
      const blobWords = await getWordsFromBlob();
      // If blobWords is an array (even empty []), return it directly! NEVER reseed if user deleted words.
      if (blobWords !== null && Array.isArray(blobWords)) {
        memoryWordsCache = blobWords;
        return blobWords;
      } else {
        // Blob store not yet initialized: Seed it with local words only if any exist
        const seed = readLocalSeedWords();
        if (seed.length > 0) {
          await saveWordsToBlob(seed);
        }
        memoryWordsCache = seed;
        return seed;
      }
    } catch (blobErr) {
      console.error('Vercel Blob getWords error, falling back:', blobErr);
    }
  }

  // 2. MongoDB Cloud Database
  if (isMongoConfigured()) {
    try {
      const collection = await getMongoWordsCollection();
      if (collection) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mongoDocs = await collection.find({}).sort({ createdAt: -1 }).toArray();
        if (mongoDocs && mongoDocs.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const words: WordItem[] = mongoDocs.map((doc: any) => ({
            id: doc.id || String(doc._id),
            word: doc.word,
            phonetic: doc.phonetic || '',
            partOfSpeech: doc.partOfSpeech,
            meaning: doc.meaning,
            example: doc.example,
            tags: Array.isArray(doc.tags) ? doc.tags : [],
            mastered: Boolean(doc.mastered),
            difficulty: doc.difficulty || 'medium',
            createdAt: doc.createdAt || new Date().toISOString(),
            updatedAt: doc.updatedAt || new Date().toISOString(),
          }));
          memoryWordsCache = words;
          return words;
        }
      }
    } catch (mongoErr) {
      console.error('MongoDB getWords error, falling back to local storage:', mongoErr);
    }
  }

  return getWordsFallback();
}

/**
 * Add a new word:
 * Saves to Vercel Blob (if configured), MongoDB (if configured), and local storage.
 */
export async function addWord(
  data: Omit<WordItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<WordItem> {
  const now = new Date().toISOString();
  const newWord: WordItem = {
    ...data,
    id: `word_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Vercel Blob Cloud Storage
  if (isBlobConfigured()) {
    try {
      const currentBlob = (await getWordsFromBlob()) || [];
      const updated = [
        newWord,
        ...currentBlob.filter(
          (w) => w.id !== newWord.id && w.word.toLowerCase() !== newWord.word.toLowerCase()
        ),
      ];
      await saveWordsToBlob(updated);
      memoryWordsCache = updated;
      await saveWordsLocally(updated);
      return newWord;
    } catch (blobErr) {
      console.error('Vercel Blob addWord error:', blobErr);
    }
  }

  // 2. MongoDB Cloud Database
  if (isMongoConfigured()) {
    try {
      const collection = await getMongoWordsCollection();
      if (collection) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await collection.insertOne({ ...newWord } as any);
        if (memoryWordsCache) {
          memoryWordsCache = [newWord, ...memoryWordsCache.filter((w) => w.id !== newWord.id)];
        }
      }
    } catch (mongoErr) {
      console.error('MongoDB addWord error:', mongoErr);
    }
  }

  const current = await getWordsFallback();
  const updated = [newWord, ...current.filter((w) => w.id !== newWord.id)];
  await saveWordsLocally(updated);

  return newWord;
}

/**
 * Update an existing word
 */
export async function updateWord(
  id: string,
  updates: Partial<Omit<WordItem, 'id' | 'createdAt'>>
): Promise<WordItem | null> {
  const updatedAt = new Date().toISOString();

  // 1. Vercel Blob
  if (isBlobConfigured()) {
    try {
      const currentBlob = (await getWordsFromBlob()) || [];
      const index = currentBlob.findIndex(
        (w) => w.id === id || w.word.toLowerCase() === id.toLowerCase()
      );
      if (index !== -1) {
        const updatedWord: WordItem = {
          ...currentBlob[index],
          ...updates,
          updatedAt,
        };
        currentBlob[index] = updatedWord;
        await saveWordsToBlob(currentBlob);
        memoryWordsCache = currentBlob;
        await saveWordsLocally(currentBlob);
        return updatedWord;
      }
    } catch (blobErr) {
      console.error('Vercel Blob updateWord error:', blobErr);
    }
  }

  // 2. MongoDB
  if (isMongoConfigured()) {
    try {
      const collection = await getMongoWordsCollection();
      if (collection) {
        const result = await collection.findOneAndUpdate(
          { $or: [{ id }, { word: { $regex: new RegExp(`^${id}$`, 'i') } }] },
          { $set: { ...updates, updatedAt } },
          { returnDocument: 'after' }
        );
        if (result) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const doc: any = result;
          const updatedWord: WordItem = {
            id: doc.id || String(doc._id),
            word: doc.word,
            phonetic: doc.phonetic || '',
            partOfSpeech: doc.partOfSpeech,
            meaning: doc.meaning,
            example: doc.example,
            tags: Array.isArray(doc.tags) ? doc.tags : [],
            mastered: Boolean(doc.mastered),
            difficulty: doc.difficulty || 'medium',
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          };
          if (memoryWordsCache) {
            memoryWordsCache = memoryWordsCache.map((w) => (w.id === id ? updatedWord : w));
          }
          return updatedWord;
        }
      }
    } catch (mongoErr) {
      console.error('MongoDB updateWord error:', mongoErr);
    }
  }

  const words = await getWordsFallback();
  const index = words.findIndex((w) => w.id === id || w.word.toLowerCase() === id.toLowerCase());
  if (index === -1) return null;

  const updatedWord: WordItem = {
    ...words[index],
    ...updates,
    updatedAt,
  };
  words[index] = updatedWord;
  await saveWordsLocally(words);
  return updatedWord;
}

/**
 * Delete a word
 */
export async function deleteWord(id: string): Promise<boolean> {
  let deleted = false;

  // 1. Vercel Blob
  if (isBlobConfigured()) {
    try {
      const currentBlob = (await getWordsFromBlob()) || [];
      const filtered = currentBlob.filter(
        (w) => w.id !== id && w.word.toLowerCase() !== id.toLowerCase()
      );
      if (filtered.length !== currentBlob.length) {
        deleted = true;
      }
      await saveWordsToBlob(filtered);
      memoryWordsCache = filtered;
      await saveWordsLocally(filtered);
      if (deleted) return true;
    } catch (blobErr) {
      console.error('Vercel Blob deleteWord error:', blobErr);
    }
  }

  // 2. MongoDB
  if (isMongoConfigured()) {
    try {
      const collection = await getMongoWordsCollection();
      if (collection) {
        const res = await collection.deleteMany({
          $or: [{ id }, { word: { $regex: new RegExp(`^${id}$`, 'i') } }],
        });
        if ((res.deletedCount || 0) > 0) {
          deleted = true;
          if (memoryWordsCache) {
            memoryWordsCache = memoryWordsCache.filter(
              (w) => w.id !== id && w.word.toLowerCase() !== id.toLowerCase()
            );
          }
        }
      }
    } catch (mongoErr) {
      console.error('MongoDB deleteWord error:', mongoErr);
    }
  }

  const words = await getWordsFallback();
  const filtered = words.filter(
    (w) => w.id !== id && w.word.toLowerCase() !== id.toLowerCase()
  );
  if (filtered.length !== words.length) {
    await saveWordsLocally(filtered);
    return true;
  }

  return deleted;
}

/**
 * Check database health and provider type
 */
export async function getDbStatus(): Promise<{
  provider: 'vercel-blob' | 'mongodb' | 'local-json';
  configured: boolean;
}> {
  if (isBlobConfigured()) {
    return { provider: 'vercel-blob', configured: true };
  }
  if (isMongoConfigured()) {
    return { provider: 'mongodb', configured: true };
  }
  return { provider: 'local-json', configured: false };
}
