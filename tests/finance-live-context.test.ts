import { jest } from '@jest/globals';
import {
  inferMarketSymbol,
  parseGoogleNewsRss,
  fetchFinancialLiveContext,
  renderFinancialLiveContext,
  renderFinancialLiveAudit,
} from '../src/finance-live-context.js';

describe('finance live context', () => {
  test('infers crypto market symbol from natural language', () => {
    expect(inferMarketSymbol('BTC has been consolidating for three weeks.')).toBe('BTCUSDT');
    expect(inferMarketSymbol('eth liquidity still looks weak')).toBe('ETHUSDT');
    expect(inferMarketSymbol('This earnings report cut guidance')).toBeUndefined();
  });

  test('parses Google News RSS items', () => {
    const xml = `<?xml version="1.0"?>
      <rss><channel>
        <item>
          <title>Bitcoin rallies on ETF optimism</title>
          <link>https://example.com/a</link>
          <pubDate>Wed, 16 Apr 2026 09:00:00 GMT</pubDate>
          <source url="https://example.com">Example News</source>
        </item>
        <item>
          <title>Ether funding flips positive</title>
          <link>https://example.com/b</link>
          <pubDate>Wed, 16 Apr 2026 10:00:00 GMT</pubDate>
          <source url="https://example.com">Macro Wire</source>
        </item>
      </channel></rss>`;

    const headlines = parseGoogleNewsRss(xml);
    expect(headlines).toHaveLength(2);
    expect(headlines[0]!.title).toContain('Bitcoin');
    expect(headlines[1]!.publisher).toBe('Macro Wire');
  });

  test('fetches live context from mocked spot, derivatives, and news endpoints', async () => {
    const fetchMock = jest.fn(async (url: string) => {
      if (url.includes('/api/v3/ticker/24hr')) {
        return {
          ok: true,
          json: async () => ({
            symbol: 'BTCUSDT',
            lastPrice: '68250.10',
            priceChangePercent: '2.31',
            volume: '12345.67',
          }),
        };
      }

      if (url.includes('/fapi/v1/fundingRate')) {
        return {
          ok: true,
          json: async () => ([
            { fundingRate: '0.00010000' },
          ]),
        };
      }

      if (url.includes('/fapi/v1/openInterest')) {
        return {
          ok: true,
          json: async () => ({
            openInterest: '45678.90',
          }),
        };
      }

      if (url.includes('/fapi/v1/premiumIndex')) {
        return {
          ok: true,
          json: async () => ({
            markPrice: '68240.00',
          }),
        };
      }

      return {
        ok: true,
        text: async () => `<?xml version="1.0"?>
          <rss><channel>
            <item>
              <title>Bitcoin sees renewed ETF inflows</title>
              <link>https://example.com/1</link>
              <pubDate>Wed, 16 Apr 2026 11:00:00 GMT</pubDate>
              <source url="https://example.com">Example News</source>
            </item>
          </channel></rss>`,
      };
    });

    const originalFetch = global.fetch;
    global.fetch = fetchMock as unknown as typeof fetch;

    try {
      const context = await fetchFinancialLiveContext(
        'BTC has been consolidating. Give me structure and liquidity.',
        { referenceTime: '2026-04-16T10:00:00.000Z' },
      );

      expect(context.symbol).toBe('BTCUSDT');
      expect(context.spot?.lastPrice).toBe(68250.10);
      expect(context.derivatives?.openInterest).toBe(45678.9);
      expect(context.headlines[0]!.title).toContain('ETF inflows');
      expect(context.warnings).toEqual([]);

      const rendered = renderFinancialLiveContext(context);
      expect(rendered).toContain('Reference time');
      expect(rendered).toContain('BTCUSDT');
      expect(rendered).toContain('Latest headlines');

      const audit = renderFinancialLiveAudit(context);
      expect(audit).toContain('[Phosphene Finance Audit]');
      expect(audit).toContain('Data status');
      expect(audit).toContain('Source hits: spot snapshot / derivatives context / latest headlines');
      expect(audit).toContain('Missing sources: none');
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('renders audit output when live sources are missing', () => {
    const audit = renderFinancialLiveAudit({
      query: 'Read the current macro tape for BTC.',
      locale: 'en',
      referenceTimeIso: '2026-04-16T10:00:00.000Z',
      symbol: 'BTCUSDT',
      headlines: [],
      warnings: ['Spot snapshot failed: timeout'],
    });

    expect(audit).toContain('Reference time: 2026-04-16T10:00:00.000Z');
    expect(audit).toContain('Freshness status: this is currently a structural reading without attached live external data.');
    expect(audit).toContain('Missing sources: spot snapshot / derivatives context / latest headlines');
    expect(audit).toContain('Warning count: 1');
  });
});
