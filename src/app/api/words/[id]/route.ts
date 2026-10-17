import { NextRequest, NextResponse } from 'next/server';
import { updateWord, deleteWord } from '@/lib/db';
import { WordInput, PartOfSpeech, DifficultyLevel } from '@/types/word';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body: Partial<WordInput> = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Word ID is required' },
        { status: 400 }
      );
    }

    // Process tags if provided
    let tagsArray: string[] | undefined = undefined;
    if (body.tags !== undefined) {
      if (Array.isArray(body.tags)) {
        tagsArray = body.tags.map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
      } else if (typeof body.tags === 'string') {
        tagsArray = body.tags
          .split(/[,\s]+/)
          .map((t) => t.trim().replace(/^#/, ''))
          .filter(Boolean);
      }
    }

    const updates: Record<string, unknown> = {};
    if (body.word !== undefined) updates.word = body.word.trim();
    if (body.phonetic !== undefined) updates.phonetic = body.phonetic.trim();
    if (body.partOfSpeech !== undefined) updates.partOfSpeech = body.partOfSpeech as PartOfSpeech;
    if (body.meaning !== undefined) updates.meaning = body.meaning.trim();
    if (body.example !== undefined) updates.example = body.example.trim();
    if (tagsArray !== undefined) updates.tags = tagsArray;
    if (body.mastered !== undefined) updates.mastered = Boolean(body.mastered);
    if (body.difficulty !== undefined) updates.difficulty = body.difficulty as DifficultyLevel;

    const updated = await updateWord(id, updates);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Word not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating word:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update word' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Word ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteWord(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Word not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Word deleted successfully' });
  } catch (error) {
    console.error('Error deleting word:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete word' },
      { status: 500 }
    );
  }
}
