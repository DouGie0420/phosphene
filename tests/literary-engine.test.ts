import {
  readLiterature,
  renderLiteraryReading,
} from '../src/literary-engine.js';

describe('literary engine', () => {
  test('produces a close reading around time and body pressure', () => {
    const reading = readLiterature(
      '我总觉得旧时间还拖在身体后面，像一扇门明明没开，风却已经先吹进来了。'
    );

    expect(reading.thesis).toContain('时间');
    expect(reading.symbols.join(' ')).toContain('身体');
    expect(reading.lineOfForce).toContain('跨越');
  });

  test('renders an english reading with the expected sections', () => {
    const rendered = renderLiteraryReading(
      readLiterature('Time kept dragging at his body, and the doorway stayed open in the dark.')
    );

    expect(rendered).toContain('[Phosphene Literary Read]');
    expect(rendered).toContain('Thesis:');
    expect(rendered).toContain('Line of force:');
  });
});
