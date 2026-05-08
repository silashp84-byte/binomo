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
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-brand-bg font-sans">
      {/* Header */}
      <header className="h-16 bg-brand-header border-b border-brand-border flex items-center justify-between px-6 z-30">
        <div className="flex items-center gap-2">
          <span className="font-serif italic text-xl font-light text-white">Binomo</span>
          <span className="text-[#666] text-xl">|</span>
          <span className="text-gray-400 text-sm font-medium tracking-wide">IA Alavancagem</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-brand-neon/10 border border-brand-neon/30 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-neon animate-pulse" />
            <span className="text-brand-neon text-[10px] font-bold tracking-widest uppercase">IA System Online</span>
          </div>
          
          <div className="text-right">
            <div className="text-[10px] text-[#999] uppercase font-medium">CONTA DEMO: silas.hp@hotmail.com</div>
            <div className="text-brand-neon text-lg font-bold tracking-tighter">
              $ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-[260px_1fr_280px] bg-brand-border h-[calc(100%-16px-32px)]">
        {/* Left Panel: Settings */}
        <section className="bg-brand-panel p-5 overflow-y-auto">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#666] mb-6">Configurações</h3>
          
          <div className="space-y-5">
            {[
              { label: 'Ativo', value: 'CRYPTO/USDT (OTC)' },
              { label: 'Valor da Operação', value: 'R$ 500,00' },
              { label: 'Tempo de Expiração', value: '1 Minuto (M1)' },
              { label: 'Estratégia IA', value: 'Price Action Avançado' }
            ].map((item, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-[12px] text-[#999]">{item.label}</label>
                <div className="bg-brand-card border border-[#333] px-3 py-2.5 rounded text-white font-mono text-sm">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-[#222]">
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

        {/* Center: Chart Area */}
        <section className="bg-brand-bg relative flex flex-col border-x border-brand-border trading-grid">
          <div className="px-5 py-4 border-b border-[#111] flex justify-between items-center bg-brand-bg/50 backdrop-blur-sm z-10">
            <span className="text-[13px] font-medium tracking-wide">GRÁFICO EM TEMPO REAL</span>
            <span className="text-[#666] text-xs">Variação: <span className="text-brand-neon font-mono">+1.24%</span></span>
          </div>

          <div className="flex-1 relative candle-bg-gradient">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 40, right: 20, left: 20, bottom: 20 }}>
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as CandlestickData;
                      return (
                        <div className="bg-brand-card p-3 border border-brand-border rounded shadow-2xl font-mono text-[10px]">
                          <p className="text-gray-500 mb-1">{d.time}</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <span>OPEN:</span> <span className="text-gray-100">{d.open.toFixed(2)}</span>
                            <span>HIGH:</span> <span className="text-gray-100">{d.high.toFixed(2)}</span>
                            <span>LOW:</span> <span className="text-gray-100">{d.low.toFixed(2)}</span>
                            <span>CLOSE:</span> <span className={d.close >= d.open ? 'text-brand-neon' : 'text-brand-danger'}>{d.close.toFixed(2)}</span>
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
                        shadow={isUp ? "0 0 10px rgba(16, 185, 129, 0.3)" : "0 0 10px rgba(239, 68, 68, 0.3)"}
                      />
                    );
                  })}
                </Bar>

                <Line 
                  type="monotone" 
                  dataKey="close" 
                  stroke="rgba(255,255,255,0.1)" 
                  strokeWidth={1} 
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Point of Entry Indicator */}
            <div className="absolute bottom-24 right-8 text-right">
              <div className="text-brand-neon text-[11px] font-bold opacity-60 tracking-wider mb-1 uppercase">Ponto de Entrada Detectado</div>
              <div className="text-brand-neon text-3xl font-bold tracking-tighter">
                {data[data.length - 1]?.close.toFixed(5)}
              </div>
            </div>

            {/* AI Active Overlay */}
            <AnimatePresence>
              {account.activeTrade && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-brand-bg/40 backdrop-blur-[2px] pointer-events-none"
                >
                  <div className="bg-brand-card/90 border border-white/5 p-8 rounded-3xl shadow-2xl text-center space-y-4">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${account.activeTrade.type === 'BUY' ? 'bg-brand-neon/20' : 'bg-brand-danger/20'}`}>
                      {account.activeTrade.type === 'BUY' ? <ArrowUpRight className="text-brand-neon w-8 h-8" /> : <ArrowDownRight className="text-brand-danger w-8 h-8" />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-[#666] uppercase tracking-widest">IA em Execução Automatizada</p>
                      <p className="text-4xl font-bold font-mono tracking-tighter">$ {account.activeTrade.amount}</p>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      Expiração: 00:08s
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Right Panel: Analysis & Signals */}
        <section className="bg-brand-panel p-5 flex flex-col">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#666] mb-6">Análise de Padrão</h3>
          
          <div className="flex-1 space-y-6">
            <AnimatePresence mode="wait">
              {lastSignal ? (
                <motion.div 
                  key={lastSignal.pattern}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="signal-gradient border border-[#333] rounded-lg p-4 space-y-4"
                >
                  <div>
                    <div className="text-[10px] text-[#888] font-bold uppercase mb-1">Padrão Identificado</div>
                    <div className="text-sm font-bold text-white uppercase tracking-tight">{lastSignal.pattern}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-1 bg-[#333] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${lastSignal.confidence * 100}%` }}
                        className={`h-full ${lastSignal.type === 'BUY' ? 'bg-brand-neon' : lastSignal.type === 'SELL' ? 'bg-brand-danger' : 'bg-gray-500'}`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-[#666]">ASSERTIVIDADE</span>
                      <span className={lastSignal.type === 'BUY' ? 'text-brand-neon' : lastSignal.type === 'SELL' ? 'text-brand-danger' : 'text-gray-500'}>
                        {(lastSignal.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#666] leading-relaxed italic border-t border-white/5 pt-3">
                    {lastSignal.reasoning}
                  </div>
                </motion.div>
              ) : (
                <div className="signal-gradient border border-[#333] border-dashed rounded-lg p-8 text-center space-y-3 opacity-50">
                  <Activity className="w-8 h-8 text-[#444] mx-auto" />
                  <p className="text-[10px] text-[#666] uppercase font-bold tracking-widest leading-normal">
                    Aguardando Identificação de Padrões...
                  </p>
                </div>
              )}
            </AnimatePresence>

            <div className="bg-[#10b98108] border border-[#10b98122] rounded-lg p-4 flex items-start gap-3">
              <ShieldCheck className="text-brand-neon w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-brand-neon uppercase">Proteção de Banca</h4>
                <p className="text-[10px] text-[#555] leading-normal">Stop Loss gerenciado automaticamente pela IA baseado em volatilidade.</p>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <div className="text-center">
               <div className="flex items-center justify-center gap-2 text-[11px] font-bold">
                  <div className={`w-1.5 h-1.5 rounded-full ${isOperating ? 'bg-brand-neon' : 'bg-brand-danger'} animate-pulse`} />
                  <span className={isOperating ? 'text-brand-neon' : 'text-brand-danger'}>
                    {isOperating ? '● SISTEMA ATIVO' : '● SISTEMA PRONTO'}
                  </span>
               </div>
            </div>

            <button 
              onClick={handleStartOperation}
              disabled={isAnalyzing}
              className={`w-full py-4 rounded font-bold text-sm tracking-widest uppercase transition-all duration-300 ${
                isOperating 
                ? 'bg-brand-danger text-black hover:bg-brand-danger/80' 
                : 'bg-brand-neon text-black hover:bg-[#34d399]'
              }`}
            >
              {isOperating ? 'PARAR OPERAÇÃO' : 'INICIAR OPERAÇÃO'}
            </button>
            <p className="text-[9px] text-[#444] text-center px-4 leading-normal">
              Ao iniciar, a IA executará a ordem automaticamente baseada na melhor taxa de entrada disponível.
            </p>
          </div>
        </section>
      </main>

      {/* Status Bar */}
      <footer className="h-8 bg-black border-t border-brand-border flex items-center px-6 gap-6 text-[10px] text-[#555] font-mono z-30">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><div className="w-1 h-1 bg-brand-neon rounded-full" /> SERVER: LONDON #4</span>
          <span>PING: 14ms</span>
          <span>API STATUS: 200 OK</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-brand-neon/60">AUTOTRADER: {isOperating ? 'ON' : 'OFF'}</span>
          <span className="text-white/20">|</span>
          <span>SILAS.HP LOGIN SESSION: ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}

