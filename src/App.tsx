/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  ShieldCheck, 
  Wallet, 
  History,
  Play,
  Pause,
  AlertTriangle,
  ChevronRight,
  Terminal as TerminalIcon,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CandlestickData, TradingSignal, AccountState } from './types';
import { analyzeMarketPatterns } from './services/geminiService';

// Mock Data Generator
const generateInitialData = (count: number): CandlestickData[] => {
  let price = 50000;
  return Array.from({ length: count }).map((_, i) => {
    const open = price;
    const change = (Math.random() - 0.5) * 40;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 15;
    const low = Math.min(open, close) - Math.random() * 15;
    price = close;
    return {
      time: new Date(Date.now() - (count - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1000)
    };
  });
};

export default function App() {
  const [data, setData] = useState<CandlestickData[]>(generateInitialData(50));
  const [account, setAccount] = useState<AccountState>({
    balance: 12450.00,
    demoMode: true
  });
  const [isOperating, setIsOperating] = useState(false);
  const [lastSignal, setLastSignal] = useState<TradingSignal | null>(null);
  const [logs, setLogs] = useState<{ id: string; msg: string; type: 'info' | 'success' | 'warn' | 'error' }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(36), msg, type }, ...prev].slice(0, 50));
  };

  // Simulate market movement
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        const open = last.close;
        const change = (Math.random() - 0.5) * 30;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * 10;
        const low = Math.min(open, close) - Math.random() * 10;
        const newData = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          open,
          high,
          low,
          close,
          volume: Math.floor(Math.random() * 800)
        };
        return [...prev.slice(1), newData];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // AI Analysis Logic
  const handleStartOperation = async () => {
    if (isOperating) {
      setIsOperating(false);
      addLog("Operação pausada pelo usuário", "warn");
      return;
    }

    setIsOperating(true);
    addLog("Modo Automático: Sincronizando com a abertura da próxima vela...", "info");
    
    // The useEffect will handle triggerAnalysis on the next data tick
  };

  const triggerAnalysis = async () => {
    setIsAnalyzing(true);
    // addLog("Sincronizado: Analisando nova vela...", "info");
    
    const signal = await analyzeMarketPatterns(data);
    setLastSignal(signal);
    setIsAnalyzing(false);

    if (signal.type !== 'NEUTRAL') {
      const color = signal.type === 'BUY' ? 'success' : 'warn';
      addLog(`SINAL: ${signal.type} detectado! Padrão [${signal.pattern}] - Confiança: ${(signal.confidence * 100).toFixed(0)}%`, color);
      addLog(`Raciocínio: ${signal.reasoning}`, "info");

      // Simulate a trade execution if confidence is high
      if (signal.confidence > 0.7) {
        executeSimulation(signal.type);
      }
    } else {
      addLog("Mercado lateralizado. Aguardando melhor momento.", "info");
    }
  };

  const executeSimulation = (type: 'BUY' | 'SELL') => {
    const amount = 500; // Updated to match design R$ 500.00
    addLog(`Executando entrada de $${amount} em ${type}...`, "success");
    
    setAccount(prev => ({
      ...prev,
      balance: prev.balance - amount,
      activeTrade: {
        type,
        entryPrice: data[data.length - 1].close,
        amount,
        startTime: Date.now()
      }
    }));

    // Simulate outcome after 10 seconds
    setTimeout(() => {
      const win = Math.random() > 0.45; 
      const profit = win ? amount * 1.87 : 0;
      
      setAccount(prev => ({
        ...prev,
        balance: prev.balance + profit,
        activeTrade: undefined
      }));

      if (win) {
        addLog(`OPERAÇÃO FINALIZADA: Lucro de $${(profit - amount).toFixed(2)}! ✅`, "success");
      } else {
        addLog(`OPERAÇÃO FINALIZADA: Loss de $${amount.toFixed(2)} ❌`, "error");
      }
    }, 10000);
  };

  // AI Analysis Synchronized Trigger
  useEffect(() => {
    const triggerSynchronizedAnalysis = async () => {
      if (isOperating && !isAnalyzing && !account.activeTrade) {
        // We trigger analysis exactly when the data updates (start of candle)
        await triggerAnalysis();
      }
    };
    
    triggerSynchronizedAnalysis();
  }, [data, isOperating]); // Triggers on every data update (new candle start)

  return (
    <div className="h-screen w-screen flex flex-col overflow-x-hidden bg-brand-bg font-sans">
      {/* Header */}
      <header className="h-14 lg:h-16 bg-brand-header border-b border-brand-border flex items-center justify-between px-4 lg:px-6 z-30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-serif italic text-lg lg:text-xl font-light text-white">Binomo</span>
          <span className="hidden sm:inline text-[#666] text-xl">|</span>
          <span className="hidden sm:inline text-gray-400 text-xs lg:text-sm font-medium tracking-wide">IA Alavancagem</span>
        </div>

        <div className="flex items-center gap-3 lg:gap-6">
          <div className="hidden xs:flex items-center gap-2 px-2 lg:px-3 py-1 bg-brand-neon/10 border border-brand-neon/30 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-neon animate-pulse" />
            <span className="text-brand-neon text-[8px] lg:text-[10px] font-bold tracking-widest uppercase">Global Server</span>
          </div>
          
          <div className="text-right">
            <div className="text-[9px] lg:text-[10px] text-[#999] uppercase font-medium truncate max-w-[120px]">DEMO: silas.hp</div>
            <div className="text-brand-neon text-sm lg:text-lg font-bold tracking-tighter">
              $ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid - Responsive Layout */}
      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-[260px_1fr_280px] bg-brand-border overflow-y-auto lg:overflow-hidden">
        
        {/* Top Section on Mobile: Signal Summary (Floating for better visibility) */}
        {!account.activeTrade && lastSignal && (
          <div className="lg:hidden p-3 bg-brand-header border-b border-brand-border sticky top-0 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${lastSignal.type === 'BUY' ? 'bg-brand-neon' : 'bg-brand-danger'}`} />
              <span className="text-[10px] font-bold uppercase">{lastSignal.pattern}</span>
            </div>
            <span className={`text-[10px] font-mono ${lastSignal.type === 'BUY' ? 'text-brand-neon' : 'text-brand-danger'}`}>
              {(lastSignal.confidence * 100).toFixed(0)}% CONF.
            </span>
          </div>
        )}

        {/* Chart Area - Main priority on mobile */}
        <section className="order-1 lg:order-2 bg-brand-bg relative flex flex-col border-b lg:border-x border-brand-border trading-grid h-[45vh] lg:h-full">
          <div className="px-4 py-3 border-b border-[#111] flex justify-between items-center bg-brand-bg/50 backdrop-blur-sm z-10 shrink-0">
            <span className="text-[11px] lg:text-[13px] font-medium tracking-wide">GRÁFICO REALTIME</span>
            <span className="text-[#666] text-[10px] lg:text-xs">VAR: <span className="text-brand-neon font-mono">+1.24%</span></span>
          </div>

          <div className="flex-1 relative candle-bg-gradient overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as CandlestickData;
                      return (
                        <div className="bg-brand-card p-2 border border-brand-border rounded shadow-2xl font-mono text-[9px]">
                          <div className="grid grid-cols-2 gap-x-2">
                            <span>A:</span> <span className="text-gray-100">{d.open.toFixed(2)}</span>
                            <span>F:</span> <span className={d.close >= d.open ? 'text-brand-neon' : 'text-brand-danger'}>{d.close.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                <Bar dataKey="close">
                  {data.map((entry, index) => {
                    const isUp = entry.close >= entry.open;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isUp ? "#10b981" : "#ef4444"} 
                      />
                    );
                  })}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>

            {/* Point of Entry Indicator */}
            <div className="absolute bottom-12 right-4 lg:bottom-24 lg:right-8 text-right pointer-events-none">
              <div className="text-brand-neon text-[9px] lg:text-[11px] font-bold opacity-60 tracking-wider mb-1 uppercase">Taxa Detectada</div>
              <div className="text-brand-neon text-xl lg:text-3xl font-bold tracking-tighter">
                {data[data.length - 1]?.close.toFixed(5)}
              </div>
            </div>

            {/* AI Active Overlay */}
            <AnimatePresence>
              {account.activeTrade && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-brand-bg/60 backdrop-blur-[4px] z-10"
                >
                  <div className="bg-brand-card/90 border border-white/10 p-6 lg:p-8 rounded-3xl shadow-2xl text-center space-y-4 max-w-[80%]">
                    <div className={`w-12 h-12 lg:w-16 lg:h-16 mx-auto rounded-full flex items-center justify-center ${account.activeTrade.type === 'BUY' ? 'bg-brand-neon/20' : 'bg-brand-danger/20'}`}>
                      {account.activeTrade.type === 'BUY' ? <ArrowUpRight className="text-brand-neon w-6 h-6 lg:w-8 lg:h-8" /> : <ArrowDownRight className="text-brand-danger w-6 h-6 lg:w-8 lg:h-8" />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] lg:text-[11px] font-bold text-[#666] uppercase tracking-widest">Execução Automatizada</p>
                      <p className="text-2xl lg:text-4xl font-bold font-mono tracking-tighter text-white">R$ {account.activeTrade.amount}</p>
                    </div>
                    <div className="text-[10px] text-brand-neon font-mono animate-pulse">
                      OPERANDO...
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Left Panel: Settings - Collapsible or scrollable on mobile */}
        <section className="order-3 lg:order-1 bg-brand-panel p-4 lg:p-5 border-b lg:border-b-0 lg:border-r border-brand-border">
          <h3 className="text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.1em] text-[#666] mb-4 lg:mb-6">Configurações</h3>
          
          <div className="grid grid-cols-2 lg:block gap-3 lg:space-y-5">
            {[
              { label: 'Ativo', value: 'CRYPTO OTC' },
              { label: 'Investimento', value: 'R$ 500,00' },
              { label: 'Timeframe', value: 'M1' },
              { label: 'Algoritmo', value: 'Gemini 3 Flash' }
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <label className="text-[10px] text-[#555]">{item.label}</label>
                <div className="bg-brand-card border border-[#222] px-3 py-2 rounded text-white font-mono text-xs">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block mt-10 pt-6 border-t border-[#222]">
             <div className="flex items-center gap-2 mb-4">
                <TerminalIcon className="w-3 h-3 text-[#666]" />
                <span className="text-[10px] font-bold text-[#666] uppercase">Console Logs</span>
             </div>
             <div className="space-y-2 h-[200px] overflow-y-auto pr-2 scrollbar-hide text-[10px] font-mono leading-relaxed">
                {logs.map(log => (
                  <div key={log.id} className="flex gap-2">
                    <span className="text-[#444] shrink-0">[{new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}]</span>
                    <span className={
                      log.type === 'success' ? 'text-brand-neon' : 
                      log.type === 'warn' ? 'text-yellow-500' : 
                      log.type === 'error' ? 'text-brand-danger' : 
                      'text-gray-500'
                    }>{log.msg}</span>
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* Right Panel: Analysis & Control */}
        <section className="order-2 lg:order-3 bg-brand-panel p-4 lg:p-5 flex flex-col border-b lg:border-b-0 border-brand-border">
          <h3 className="text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.1em] text-[#666] mb-4 lg:mb-6">Painel de Analista AI</h3>
          
          <div className="flex-1 space-y-4 mb-4">
            <AnimatePresence mode="wait">
              {lastSignal ? (
                <motion.div 
                  key={lastSignal.pattern}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="signal-gradient border border-[#333] rounded-lg p-3 lg:p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[9px] text-[#888] font-bold uppercase">PADRÃO</div>
                      <div className="text-xs lg:text-sm font-bold text-white tracking-tight">{lastSignal.pattern}</div>
                    </div>
                    <div className={`${lastSignal.type === 'BUY' ? 'text-brand-neon' : 'text-brand-danger'} font-bold font-mono text-xs uppercase`}>
                      {lastSignal.type}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-1 bg-[#222] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${lastSignal.confidence * 100}%` }}
                        className={`h-full ${lastSignal.type === 'BUY' ? 'bg-brand-neon' : lastSignal.type === 'SELL' ? 'bg-brand-danger' : 'bg-gray-500'}`}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-[#555]">PROBABILIDADE</span>
                      <span className={lastSignal.type === 'BUY' ? 'text-brand-neon' : 'text-brand-danger'}>
                        {(lastSignal.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#666] leading-relaxed italic line-clamp-2">
                    {lastSignal.reasoning}
                  </div>
                </motion.div>
              ) : (
                <div className="signal-gradient border border-[#333] border-dashed rounded-lg p-6 text-center space-y-2 opacity-50">
                  <Activity className="w-6 h-6 text-[#444] mx-auto animate-pulse" />
                  <p className="text-[9px] text-[#666] uppercase font-bold tracking-widest">
                    AI Scanning...
                  </p>
                </div>
              )}
            </AnimatePresence>

            <div className="bg-[#10b98105] border border-[#10b98115] rounded-lg p-3 hidden sm:flex items-start gap-3">
              <ShieldCheck className="text-brand-neon w-4 h-4 shrink-0" />
              <div className="space-y-0.5">
                <h4 className="text-[9px] font-bold text-brand-neon uppercase">Security Guard Active</h4>
                <p className="text-[9px] text-[#444] leading-tight">Gestão de capital orientada pela API Gemini.</p>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-3 pb-2 lg:pb-0">
            <button 
              onClick={handleStartOperation}
              disabled={isAnalyzing}
              className={`w-full py-4 lg:py-5 rounded-lg font-bold text-xs lg:text-sm tracking-[0.2em] uppercase transition-all shadow-xl active:scale-[0.98] ${
                isOperating 
                ? 'bg-brand-danger text-black' 
                : 'bg-brand-neon text-black'
              }`}
            >
              {isOperating ? 'DESATIVAR SISTEMA' : 'INICIAR ALAVANCAGEM'}
            </button>
            <div className="flex items-center justify-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isOperating ? 'bg-brand-neon animate-pulse' : 'bg-[#333]'}`} />
              <p className="text-[8px] text-[#444] text-center uppercase font-bold tracking-widest">
                API: {isAnalyzing ? 'Processando...' : isOperating ? 'Sincronizado' : 'Aguardando'}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Only visible on Tablet/Desktop or very bottom */}
      <footer className="h-8 bg-black border-t border-brand-border hidden xs:flex items-center px-4 lg:px-6 gap-4 lg:gap-6 text-[9px] lg:text-[10px] text-[#444] font-mono z-30 shrink-0">
        <div className="flex gap-4">
          <span className="hidden sm:flex items-center gap-1"><div className="w-1 h-1 bg-brand-neon rounded-full" /> SVR: LDN#4</span>
          <span>PING: 14ms</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-brand-neon/60">AUTOTRADER: {isOperating ? 'READY' : 'STANDBY'}</span>
          <span className="hidden sm:inline text-white/10">|</span>
          <span className="truncate max-w-[100px]">SESSION: {new Date().toLocaleTimeString()}</span>
        </div>
      </footer>
    </div>

  );
}

