import { NextRequest, NextResponse } from 'next/server';
import { PartOfSpeech, DifficultyLevel } from '@/types/word';

export const dynamic = 'force-dynamic';

interface DictionaryDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
}

interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
  synonyms?: string[];
}

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics?: { text?: string; audio?: string }[];
  meanings: DictionaryMeaning[];
}

interface DatamuseEntry {
  word: string;
  tags?: string[];
  defs?: string[];
}

function calculateDifficulty(word: string, definition: string): DifficultyLevel {
  const cleanWord = word.trim().toLowerCase();
  const len = cleanWord.length;
  if (len >= 9 || definition.length > 95) {
    return 'hard';
  } else if (len >= 6 || definition.length > 50) {
    return 'medium';
  }
  return 'easy';
}

function mapPartOfSpeech(pos: string): PartOfSpeech {
  const lower = pos.toLowerCase().trim();
  if (['noun', 'verb', 'adjective', 'adverb', 'interjection'].includes(lower)) {
    return lower as PartOfSpeech;
  }
  if (lower === 'n') return 'noun';
  if (lower === 'v') return 'verb';
  if (lower === 'adj') return 'adjective';
  if (lower === 'adv') return 'adverb';
  if (lower.includes('idiom') || lower.includes('expression')) return 'idiom';
  if (lower.includes('phrase')) return 'phrase';
  return 'other';
}

function generateExample(word: string, pos: PartOfSpeech): string {
  const capWord = word.charAt(0).toUpperCase() + word.slice(1);
  if (pos === 'noun') {
    return `The discovery of ${word.toLowerCase()} inspired everyone on the team.`;
  } else if (pos === 'adjective') {
    return `Her ${word.toLowerCase()} approach brought fresh clarity to the discussion.`;
  } else if (pos === 'verb') {
    return `They decided to ${word.toLowerCase()} before finalizing their decision.`;
  } else if (pos === 'adverb') {
    return `She spoke ${word.toLowerCase()} about the journey ahead.`;
  }
  return `${capWord} captures a profound meaning in modern context.`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawWord = searchParams.get('word')?.trim();

    if (!rawWord) {
      return NextResponse.json(
        { success: false, error: 'Word parameter is required' },
        { status: 400 }
      );
    }

    const cleanWord = rawWord.toLowerCase().replace(/[^a-z-]/g, '');
    const formattedWord = rawWord.charAt(0).toUpperCase() + rawWord.slice(1).toLowerCase();

    // 1. Try Free Dictionary API
    try {
      const freeDictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`;
      const res = await fetch(freeDictUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VocabForest/1.0',
          Accept: 'application/json',
        },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const entries: DictionaryEntry[] = await res.json();
        if (entries && entries.length > 0) {
          const entry = entries[0];
          let phonetic = entry.phonetic || '';
          if (!phonetic && entry.phonetics) {
            const p = entry.phonetics.find((item) => item.text && item.text.trim());
            if (p?.text) phonetic = p.text;
          }

          let selectedMeaning: DictionaryMeaning | null = null;
          let selectedDef: DictionaryDefinition | null = null;
          let exampleSentence = '';
          const collectedSynonyms: string[] = [];

          for (const m of entry.meanings) {
            if (m.synonyms) collectedSynonyms.push(...m.synonyms);
            for (const d of m.definitions) {
              if (!selectedMeaning) {
                selectedMeaning = m;
                selectedDef = d;
              }
              if (d.example && !exampleSentence) {
                exampleSentence = d.example;
                selectedMeaning = m;
                selectedDef = d;
              }
              if (d.synonyms) collectedSynonyms.push(...d.synonyms);
            }
          }

          if (selectedMeaning && selectedDef) {
            const pos = mapPartOfSpeech(selectedMeaning.partOfSpeech);
            const defText = selectedDef.definition.trim();
            const ex = exampleSentence || generateExample(cleanWord, pos);
            const cleanSynonyms = Array.from(new Set(collectedSynonyms))
              .filter((s) => s && s.length > 2 && !s.includes(' '))
              .slice(0, 3);
            const tags = Array.from(new Set([pos, ...cleanSynonyms, 'vocabulary'])).slice(0, 4);

            return NextResponse.json({
              success: true,
              data: {
                word: formattedWord,
                phonetic: phonetic || '',
                partOfSpeech: pos,
                meaning: defText,
                example: ex,
                tags: tags.join(', '),
                difficulty: calculateDifficulty(cleanWord, defText),
              },
            });
          }
        }
      }
    } catch (err) {
      console.warn('Free Dictionary API failed, trying Datamuse fallback:', err);
    }

    // 2. Fallback to Datamuse API
    try {
      const datamuseUrl = `https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&md=dpr&max=1`;
      const dmRes = await fetch(datamuseUrl);

      if (dmRes.ok) {
        const dmEntries: DatamuseEntry[] = await dmRes.json();
        const defs = dmEntries?.[0]?.defs;
        if (defs && defs.length > 0) {
          const rawDef = defs[0];
          const [rawPos, defContent] = rawDef.includes('\t')
            ? rawDef.split('\t')
            : ['n', rawDef];

          const pos = mapPartOfSpeech(rawPos);
          const defText = defContent.trim();
          const tags = [pos, 'vocabulary'];

          return NextResponse.json({
            success: true,
            data: {
              word: formattedWord,
              phonetic: '',
              partOfSpeech: pos,
              meaning: defText,
              example: generateExample(cleanWord, pos),
              tags: tags.join(', '),
              difficulty: calculateDifficulty(cleanWord, defText),
            },
          });
        }
      }
    } catch (dmErr) {
      console.warn('Datamuse fallback failed:', dmErr);
    }

    return NextResponse.json(
      { success: false, error: `Could not find a dictionary entry for "${rawWord}". You can still fill it in manually!` },
      { status: 404 }
    );
  } catch (error) {
    console.error('Lookup endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while retrieving word details.' },
      { status: 500 }
    );
  }
}
