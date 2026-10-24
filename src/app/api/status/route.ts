import { NextResponse } from 'next/server';
import { getDbStatus, getWords } from '@/lib/db';
import { isBlobConfigured } from '@/lib/blob';
import { list } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getDbStatus();
    const words = await getWords();
    let blobList: Array<{ pathname: string; url: string; size: number; uploadedAt: string | Date }> = [];
    if (isBlobConfigured()) {
      try {
        const res = await list({ prefix: 'vocabforest/', limit: 10 });
        blobList = res.blobs.map((b) => ({
          pathname: b.pathname,
          url: b.url,
          size: b.size,
          uploadedAt: b.uploadedAt,
        }));
      } catch (e: unknown) {
        console.warn('Could not list blobs:', e);
      }
    }

    return NextResponse.json({
      success: true,
      data: status,
      wordCount: words.length,
      words: words.map((w) => w.word),
      blobs: blobList,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve database status' },
      { status: 500 }
    );
  }
}
