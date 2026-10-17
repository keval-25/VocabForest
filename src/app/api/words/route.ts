import { NextRequest, NextResponse } from 'next/server';
import { getWords, addWord } from '@/lib/db';
import { WordInput, PartOfSpeech, DifficultyLevel } from '@/types/word';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.toLowerCase().trim() || '';
    const tag = searchParams.get('tag')?.toLowerCase().trim() || '';
    const pos = searchParams.get('pos')?.toLowerCase().trim() || '';
    const sort = searchParams.get('sort') || 'newest';

    let words = await getWords();

    if (search) {
      words = words.filter(
        (w) =>
          w.word.toLowerCase().includes(search) ||
          w.meaning.toLowerCase().includes(search) ||
          w.example.toLowerCase().includes(search) ||
          w.tags.some((t) => t.toLowerCase().includes(search))
      );
    }

    if (tag && tag !== 'all') {
      words = words.filter((w) => w.tags.map((t) => t.toLowerCase()).includes(tag));
    }

    if (pos && pos !== 'all') {
      words = words.filter((w) => w.partOfSpeech.toLowerCase() === pos);
    }

    if (sort === 'az') {
      words.sort((a, b) => a.word.localeCompare(b.word));
    } else if (sort === 'za') {
      words.sort((a, b) => b.word.localeCompare(a.word));
    } else if (sort === 'difficulty') {
      const rank: Record<string, number> = { hard: 3, medium: 2, easy: 1 };
      words.sort((a, b) => (rank[b.difficulty] || 0) - (rank[a.difficulty] || 0));
    } else {
      // Default: newest first
      words.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return NextResponse.json({ success: true, count: words.length, data: words });
  } catch (error) {
    console.error('Error fetching words:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve words' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: WordInput = await request.json();

    if (!body.word || !body.word.trim()) {
      return NextResponse.json(
        { success: false, error: 'Word is required' },
        { status: 400 }
      );
    }

    if (!body.meaning || !body.meaning.trim()) {
      return NextResponse.json(
        { success: false, error: 'Meaning is required' },
        { status: 400 }
      );
    }

    // Process tags
    let tagsArray: string[] = [];
    if (Array.isArray(body.tags)) {
      tagsArray = body.tags.map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
    } else if (typeof body.tags === 'string') {
      tagsArray = body.tags
        .split(/[,\s]+/)
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);
    }

    const created = await addWord({
      word: body.word.trim(),
      phonetic: body.phonetic?.trim() || '',
      partOfSpeech: (body.partOfSpeech || 'noun') as PartOfSpeech,
      meaning: body.meaning.trim(),
      example: body.example?.trim() || '',
      tags: tagsArray.length > 0 ? tagsArray : ['vocabulary'],
      mastered: !!body.mastered,
      difficulty: (body.difficulty || 'medium') as DifficultyLevel
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error adding word:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add word to database' },
      { status: 500 }
    );
  }
}
