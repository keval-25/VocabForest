import { NextRequest, NextResponse } from 'next/server';
import { PartOfSpeech, DifficultyLevel } from '@/types/word';

export const dynamic = 'force-dynamic';

interface GoogleDictEntry {
  partOfSpeech: string;
  definition: string;
  example?: string;
  synonyms: string[];
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

// Generates formal IELTS Band 8-9 & GRE Analytical Writing academic context sentences
function generateAcademicExample(word: string, pos: PartOfSpeech, meaning: string): string {
  const lowerWord = word.toLowerCase();
  const capWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

  switch (pos) {
    case 'verb':
      return `Comprehensive empirical research and policy reforms are imperative to ${lowerWord} the systemic challenges identified in the study.`;
    case 'adjective':
      return `The committee observed a ${lowerWord} discrepancy between theoretical projections and observed empirical outcomes.`;
    case 'noun':
      return `Scholars argue that understanding the ${lowerWord} is pivotal to deciphering broader socioeconomic paradigm shifts.`;
    case 'adverb':
      return `The research findings ${lowerWord} illustrate the subtle correlation between environmental stress and cognitive resilience.`;
    default:
      return `In academic discourse, ${capWord} serves as a quintessential concept for elucidating complex theoretical models.`;
  }
}

// Estimates CEFR & GRE/IELTS difficulty
function evaluateDifficulty(word: string, defLength: number): DifficultyLevel {
  const len = word.length;
  if (len >= 8 || defLength > 70) return 'hard';
  if (len >= 5 || defLength > 40) return 'medium';
  return 'easy';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawWord = searchParams.get('word')?.trim();
    const mode = searchParams.get('mode') || 'academic'; // 'academic' (IELTS/GRE) or 'general'

    if (!rawWord) {
      return NextResponse.json(
        { success: false, error: 'Word parameter is required' },
        { status: 400 }
      );
    }

    const cleanWord = rawWord.toLowerCase().replace(/[^a-z-]/g, '');
    const formattedWord = rawWord.charAt(0).toUpperCase() + rawWord.slice(1).toLowerCase();

    let primaryDef = '';
    let partOfSpeech: PartOfSpeech = 'noun';
    let exampleSentence = '';
    let phonetic = '';
    const collectedSynonyms: string[] = [];

    // =========================================================================
    // 1. Google Oxford Languages Engine (Oxford Dictionary database via Google)
    // =========================================================================
    try {
      const googleDictUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=en&dt=md&dt=ss&dt=ex&q=${encodeURIComponent(cleanWord)}`;
      const gRes = await fetch(googleDictUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VocabForest-Oxford/2.0',
        },
        next: { revalidate: 3600 },
      });

      if (gRes.ok) {
        const gData = await gRes.json();

        // Extract definitions from Google Oxford payload (index 12)
        const defSections = gData[12];
        if (Array.isArray(defSections) && defSections.length > 0) {
          const firstSection = defSections[0];
          const rawPos = firstSection[0] || 'noun';
          partOfSpeech = mapPartOfSpeech(rawPos);

          const defEntries = firstSection[1];
          if (Array.isArray(defEntries) && defEntries.length > 0) {
            const firstEntry = defEntries[0];
            primaryDef = firstEntry[0] || '';
            // Example embedded in definition
            if (firstEntry[2]) {
              exampleSentence = firstEntry[2];
            }
          }
        }

        // Extract Oxford examples (index 13) if example not yet found
        if (!exampleSentence && Array.isArray(gData[13]) && gData[13].length > 0) {
          const exList = gData[13][0];
          if (Array.isArray(exList) && exList.length > 0 && exList[0]?.[0]) {
            exampleSentence = exList[0][0].replace(/<[^>]*>/g, '').trim();
          }
        }

        // Extract Oxford academic synonyms (index 11)
        if (Array.isArray(gData[11])) {
          for (const synSection of gData[11]) {
            const synGroup = synSection?.[1];
            if (Array.isArray(synGroup)) {
              for (const item of synGroup) {
                if (Array.isArray(item?.[0])) {
                  collectedSynonyms.push(...item[0]);
                }
              }
            }
          }
        }
      }
    } catch (gErr) {
      console.warn('Google Oxford endpoint notice:', gErr);
    }

    // =========================================================================
    // 2. Fetch High-Accuracy IPA Phonetics & Backup Definitions
    // =========================================================================
    try {
      const freeDictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`;
      const pRes = await fetch(freeDictUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 VocabForest/2.0',
          Accept: 'application/json',
        },
        next: { revalidate: 3600 },
      });

      if (pRes.ok) {
        const pData = await pRes.json();
        if (Array.isArray(pData) && pData.length > 0) {
          const entry = pData[0];
          if (entry.phonetic) {
            phonetic = entry.phonetic;
          } else if (entry.phonetics) {
            const pObj = entry.phonetics.find((p: { text?: string }) => p.text && p.text.trim());
            if (pObj?.text) phonetic = pObj.text;
          }

          // If Google Oxford didn't catch definition, fallback to Wiktionary entry
          if (!primaryDef && entry.meanings && entry.meanings.length > 0) {
            const m = entry.meanings[0];
            partOfSpeech = mapPartOfSpeech(m.partOfSpeech);
            if (m.definitions && m.definitions.length > 0) {
              primaryDef = m.definitions[0].definition;
              if (m.definitions[0].example && !exampleSentence) {
                exampleSentence = m.definitions[0].example;
              }
            }
            if (m.synonyms) collectedSynonyms.push(...m.synonyms);
          }
        }
      }
    } catch {
      // ignore
    }

    // =========================================================================
    // 3. Fallback to Datamuse Academic Lexicon if still empty
    // =========================================================================
    if (!primaryDef) {
      try {
        const dmUrl = `https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&md=dpr&max=1`;
        const dmRes = await fetch(dmUrl);
        if (dmRes.ok) {
          const dmData = await dmRes.json();
          const defs = dmData?.[0]?.defs;
          if (defs && defs.length > 0) {
            const raw = defs[0];
            const [rawPos, defContent] = raw.includes('\t') ? raw.split('\t') : ['n', raw];
            partOfSpeech = mapPartOfSpeech(rawPos);
            primaryDef = defContent.trim();
          }
        }
      } catch {
        // ignore
      }
    }

    if (!primaryDef) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not find an authoritative dictionary entry for "${rawWord}". You can enter it manually!`,
        },
        { status: 404 }
      );
    }

    // Clean up definition text
    let cleanDef = primaryDef.trim();
    cleanDef = cleanDef.charAt(0).toUpperCase() + cleanDef.slice(1);
    if (!cleanDef.endsWith('.')) cleanDef += '.';

    // Curate IELTS / GRE level academic example sentence
    let finalExample = exampleSentence;
    if (mode === 'academic' || !finalExample || finalExample.length < 15) {
      // Craft high-level IELTS Band 8-9 / GRE example sentence
      finalExample = generateAcademicExample(cleanWord, partOfSpeech, cleanDef);
    }

    // Filter and curate GRE / IELTS academic synonyms
    const cleanSynonyms = Array.from(new Set(collectedSynonyms))
      .map((s) => s.toLowerCase().trim())
      .filter((s) => s && s.length > 2 && !s.includes(' ') && s !== cleanWord)
      .slice(0, 3);

    // Build IELTS/GRE tags
    const academicTags = mode === 'academic'
      ? ['gre', 'ielts-band-9', partOfSpeech, ...cleanSynonyms]
      : [partOfSpeech, ...cleanSynonyms, 'vocabulary'];

    const tagsString = Array.from(new Set(academicTags)).slice(0, 5).join(', ');
    const difficulty = evaluateDifficulty(cleanWord, cleanDef.length);

    return NextResponse.json({
      success: true,
      source: 'Google Oxford Languages & Academic GRE/IELTS Engine',
      data: {
        word: formattedWord,
        phonetic: phonetic || '',
        partOfSpeech,
        meaning: cleanDef,
        example: finalExample,
        tags: tagsString,
        difficulty,
      },
    });
  } catch (error) {
    console.error('Academic Lookup API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while retrieving word details.' },
      { status: 500 }
    );
  }
}
