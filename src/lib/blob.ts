import { put, list } from '@vercel/blob';
import { WordItem } from '@/types/word';

const BLOB_PATH = 'vocabforest/words.json';

/**
 * Checks whether Vercel Blob is configured.
 * Modern Vercel provisions BLOB_STORE_ID (authenticated via Vercel OIDC).
 * Legacy or manual setups provision BLOB_READ_WRITE_TOKEN.
 */
export function isBlobConfigured(): boolean {
  const hasStoreId = Boolean(process.env.BLOB_STORE_ID && process.env.BLOB_STORE_ID.trim().length > 0);
  const hasToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN.trim().length > 0);
  return hasStoreId || hasToken;
}

/**
 * Fetch words from Vercel Blob cloud storage
 */
export async function getWordsFromBlob(): Promise<WordItem[] | null> {
  if (!isBlobConfigured()) return null;

  try {
    const { blobs } = await list({ prefix: BLOB_PATH, limit: 10 });
    if (!blobs || blobs.length === 0) {
      return null;
    }

    const targetBlob = blobs.find((b) => b.pathname === BLOB_PATH) || blobs[0];
    
    // Add timestamp cache-buster so CDN never serves stale cached JSON
    const cacheBusterUrl = targetBlob.url.includes('?') 
      ? `${targetBlob.url}&_cb=${Date.now()}`
      : `${targetBlob.url}?_cb=${Date.now()}`;

    const response = await fetch(cacheBusterUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch blob content from ${targetBlob.url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching words from Vercel Blob:', error);
    return null;
  }
}

/**
 * Persist words JSON file to Vercel Blob cloud storage
 */
export async function saveWordsToBlob(words: WordItem[]): Promise<boolean> {
  if (!isBlobConfigured()) return false;

  try {
    const jsonString = JSON.stringify(words, null, 2);
    await put(BLOB_PATH, jsonString, {
      access: 'public',
      addRandomSuffix: false, // Ensures static pathname 'vocabforest/words.json'
      cacheControlMaxAge: 0,   // Prevent CDN caching
    });
    return true;
  } catch (error) {
    console.error('Error saving words to Vercel Blob:', error);
    return false;
  }
}
