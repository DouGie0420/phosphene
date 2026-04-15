import {
  buildKnowledgeBrief,
  getKnowledgeNotes,
  getKnowledgeSources,
  listKnowledgeDomains,
} from '../src/knowledge-atlas.js';

describe('knowledge atlas', () => {
  test('lists all supported domains', () => {
    expect(listKnowledgeDomains()).toEqual([
      'design',
      'color',
      'structure',
      'stream',
      'creativity',
      'finance',
      'crypto',
      'persona',
      'protocols',
    ]);
  });

  test('returns notes and sources for a known domain', () => {
    expect(getKnowledgeNotes('finance').length).toBeGreaterThan(0);
    expect(getKnowledgeSources('finance').length).toBeGreaterThan(0);
    expect(getKnowledgeNotes('design').length).toBeGreaterThan(0);
    expect(getKnowledgeSources('persona').length).toBeGreaterThan(0);
  });

  test('filters notes by query', () => {
    const results = getKnowledgeNotes('color', 'contrast');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(note =>
      `${note.label} ${note.summary} ${note.application} ${note.keywords.join(' ')}`
        .toLowerCase()
        .includes('contrast')
    )).toBe(true);
  });

  test('builds a readable atlas brief', () => {
    const brief = buildKnowledgeBrief('crypto');
    expect(brief).toContain('Phosphene Atlas: crypto');
    expect(brief).toContain('Sources:');
  });

  test('includes protocol notes for structural prompting', () => {
    const brief = buildKnowledgeBrief('protocols', 'pipeline');
    expect(brief).toContain('pipeline');
  });
});
