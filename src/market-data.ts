// Phosphene — Market Data
// Binance public REST API client. No API key required for market data.
// All price data is live; analysis layers are applied on top.

import https from 'https';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Kline {
  openTime:   number;   // ms timestamp
  open:       number;
  high:       number;
  low:        number;
  close:      number;
  volume:     number;
  closeTime:  number;
}

export interface Ticker24h {
  symbol:             string;
  priceChange:        number;
  priceChangePct:     number;
  weightedAvgPrice:   number;
  prevClosePrice:     number;
  lastPrice:          number;
  lastQty:            number;
  bidPrice:           number;
  bidQty:             number;
  askPrice:           number;
  askQty:             number;
  openPrice:          number;
  highPrice:          number;
  lowPrice:           number;
  volume:             number;
  quoteVolume:        number;
  openTime:           number;
  closeTime:          number;
  count:              number;
}

export interface OrderBookLevel {
  price:  number;
  qty:    number;
}

export interface OrderBook {
  symbol:   string;
  lastUpdateId: number;
  bids:     OrderBookLevel[];
  asks:     OrderBookLevel[];
}

export type KlineInterval =
  | '1m' | '3m' | '5m' | '15m' | '30m'
  | '1h' | '2h' | '4h' | '6h' | '8h' | '12h'
  | '1d' | '3d' | '1w' | '1M';

export interface MarketSnapshot {
  symbol:    string;
  interval:  KlineInterval;
  klines:    Kline[];
  ticker:    Ticker24h;
  orderBook: OrderBook;
  fetchedAt: number;
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

function httpsGet(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 10_000 }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (e) {
          reject(new Error(`JSON parse error: ${(e as Error).message}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

const BASE = 'https://api.binance.com';

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * Fetch OHLCV klines from Binance.
 * Default: last 200 candles of 1h interval for BTCUSDT.
 */
export async function fetchKlines(
  symbol: string,
  interval: KlineInterval = '1h',
  limit = 200,
): Promise<Kline[]> {
  const sym = symbol.toUpperCase();
  const url = `${BASE}/api/v3/klines?symbol=${sym}&interval=${interval}&limit=${limit}`;
  const raw = await httpsGet(url) as unknown[][];

  return raw.map((k) => ({
    openTime:  Number(k[0]),
    open:      parseFloat(k[1] as string),
    high:      parseFloat(k[2] as string),
    low:       parseFloat(k[3] as string),
    close:     parseFloat(k[4] as string),
    volume:    parseFloat(k[5] as string),
    closeTime: Number(k[6]),
  }));
}

/**
 * Fetch 24h ticker statistics.
 */
export async function fetchTicker(symbol: string): Promise<Ticker24h> {
  const sym = symbol.toUpperCase();
  const url = `${BASE}/api/v3/ticker/24hr?symbol=${sym}`;
  const raw = await httpsGet(url) as Record<string, string | number>;

  return {
    symbol:           String(raw['symbol']),
    priceChange:      parseFloat(raw['priceChange'] as string),
    priceChangePct:   parseFloat(raw['priceChangePercent'] as string),
    weightedAvgPrice: parseFloat(raw['weightedAvgPrice'] as string),
    prevClosePrice:   parseFloat(raw['prevClosePrice'] as string),
    lastPrice:        parseFloat(raw['lastPrice'] as string),
    lastQty:          parseFloat(raw['lastQty'] as string),
    bidPrice:         parseFloat(raw['bidPrice'] as string),
    bidQty:           parseFloat(raw['bidQty'] as string),
    askPrice:         parseFloat(raw['askPrice'] as string),
    askQty:           parseFloat(raw['askQty'] as string),
    openPrice:        parseFloat(raw['openPrice'] as string),
    highPrice:        parseFloat(raw['highPrice'] as string),
    lowPrice:         parseFloat(raw['lowPrice'] as string),
    volume:           parseFloat(raw['volume'] as string),
    quoteVolume:      parseFloat(raw['quoteVolume'] as string),
    openTime:         Number(raw['openTime']),
    closeTime:        Number(raw['closeTime']),
    count:            Number(raw['count']),
  };
}

/**
 * Fetch order book depth (top N bids/asks).
 */
export async function fetchOrderBook(symbol: string, limit = 20): Promise<OrderBook> {
  const sym = symbol.toUpperCase();
  const url = `${BASE}/api/v3/depth?symbol=${sym}&limit=${limit}`;
  const raw = await httpsGet(url) as {
    lastUpdateId: number;
    bids: [string, string][];
    asks: [string, string][];
  };

  return {
    symbol: sym,
    lastUpdateId: raw.lastUpdateId,
    bids: raw.bids.map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) })),
    asks: raw.asks.map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) })),
  };
}

/**
 * Fetch everything in parallel and return a snapshot.
 */
export async function fetchMarketSnapshot(
  symbol: string,
  interval: KlineInterval = '1h',
  klineLimit = 200,
): Promise<MarketSnapshot> {
  const sym = symbol.toUpperCase();
  const [klines, ticker, orderBook] = await Promise.all([
    fetchKlines(sym, interval, klineLimit),
    fetchTicker(sym),
    fetchOrderBook(sym, 20),
  ]);

  return { symbol: sym, interval, klines, ticker, orderBook, fetchedAt: Date.now() };
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatPrice(price: number, decimals = 2): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  if (price >= 1)    return price.toFixed(4);
  return price.toFixed(8);
}

export function formatPct(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}
