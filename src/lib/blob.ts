import { put, list, del } from '@vercel/blob';
import { WordItem } from '@/types/word';

const BLOB_PREFIX = 'vocabforest/words_';

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
 * Fetch words from Vercel Blob cloud storage.
 * Reads the latest versioned blob so CDN edge cache can NEVER serve stale data.
 */
export async function getWordsFromBlob(): Promise<WordItem[] | null> {
  if (!isBlobConfigured()) return null;

  try {
    const { blobs } = await list({ prefix: 'vocabforest/' });
    if (!blobs || blobs.length === 0) {
      return null;
    }

    // Sort newest first:
    const sorted = [...blobs].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    const targetBlob = sorted[0];

    const response = await fetch(targetBlob.url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
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
 * Persist words JSON file to Vercel Blob cloud storage.
 * Creates a unique timestamped file version so every write yields a fresh URL
 * that completely bypasses Vercel/Cloudflare CDN edge cache.
 * Cleans up older blobs so storage remains compact.
 */
export async function saveWordsToBlob(words: WordItem[]): Promise<boolean> {
  if (!isBlobConfigured()) return false;

  try {
    const newPath = `${BLOB_PREFIX}${Date.now()}_${Math.random().toString(36).substring(2, 7)}.json`;
    const jsonString = JSON.stringify(words, null, 2);

    await put(newPath, jsonString, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
    });

    // Clean up older blobs asynchronously
    try {
      const { blobs } = await list({ prefix: 'vocabforest/' });
      const oldBlobs = blobs.filter((b) => b.pathname !== newPath);
      if (oldBlobs.length > 0) {
        await del(oldBlobs.map((b) => b.url));
      }
    } catch (cleanupErr) {
      console.warn('Non-fatal: Error cleaning up older blobs:', cleanupErr);
    }

    return true;
  } catch (error) {
    console.error('Error saving words to Vercel Blob:', error);
    return false;
  }
}
