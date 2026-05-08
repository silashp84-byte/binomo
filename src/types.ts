export interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradingSignal {
  type: 'BUY' | 'SELL' | 'NEUTRAL';
  pattern: string;
  confidence: number; // 0 to 1
  reasoning: string;
}

export interface AccountState {
  balance: number;
  demoMode: boolean;
  activeTrade?: {
    type: 'BUY' | 'SELL';
    entryPrice: number;
    amount: number;
    startTime: number;
  };
}
