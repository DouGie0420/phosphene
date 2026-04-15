import {
  composeMarketReading,
  readMarketText,
  renderMarketReading,
} from '../src/market-engine.js';
import type { MarketSnapshot } from '../src/market-data.js';
import type { TechnicalAnalysisResult } from '../src/technical-analysis.js';

describe('market engine', () => {
  test('reads mixed earnings language as narrative vs flow tension', () => {
    const reading = readMarketText('The company beat earnings, but cut guidance and warned about weaker demand.');

    expect(reading.narrativeVsFlow).toContain('Headline positive');
    expect(reading.signalStack.join(' ')).toContain('Guidance Cut');
  });

  test('composes a live-structure reading from snapshot and technicals', () => {
    const snapshot: MarketSnapshot = {
      symbol: 'BTCUSDT',
      interval: '1h',
      klines: [],
      fetchedAt: Date.now(),
      ticker: {
        symbol: 'BTCUSDT',
        priceChange: 1200,
        priceChangePct: 2.1,
        weightedAvgPrice: 64000,
        prevClosePrice: 63500,
        lastPrice: 64800,
        lastQty: 1,
        bidPrice: 64790,
        bidQty: 5,
        askPrice: 64810,
        askQty: 4,
        openPrice: 63500,
        highPrice: 65200,
        lowPrice: 62800,
        volume: 1000,
        quoteVolume: 64000000,
        openTime: 0,
        closeTime: 0,
        count: 10000,
      },
      orderBook: {
        symbol: 'BTCUSDT',
        lastUpdateId: 1,
        bids: [{ price: 64790, qty: 10 }],
        asks: [{ price: 64810, qty: 4 }],
      },
    };

    const analysis: TechnicalAnalysisResult = {
      summary: '',
      fibonacci: {
        swingHigh: { index: 100, price: 66000, type: 'high', time: 1 },
        swingLow: { index: 80, price: 60000, type: 'low', time: 0 },
        direction: 'uptrend',
        retracements: [],
        extensions: [],
        currentPrice: 64800,
        nearestSupport: { ratio: 0.382, price: 63708, label: 'Retrace 38.2%', isKey: true },
        nearestResist: { ratio: 1.618, price: 69708, label: 'Ext 161.8%', isKey: true },
        currentZone: 'Between Retrace 38.2% and Ext 161.8%',
      },
      chanLun: {
        processedCandles: [],
        fractals: [],
        bis: [],
        hubs: [],
        beiChiList: [],
        buySellPoints: [],
        currentStructure: '当前离开上升中枢后仍在延续。'
      },
    };

    const reading = composeMarketReading(snapshot, analysis);
    const rendered = renderMarketReading(reading);

    expect(reading.thesis).toContain('上升结构');
    expect(rendered).toContain('【Phosphene Market Read】');
    expect(rendered).toContain('失效条件');
  });
});
