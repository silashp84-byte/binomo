import { GoogleGenAI, Type } from "@google/genai";
import { CandlestickData, TradingSignal } from "../types";

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please configure it in the Secrets panel.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export async function analyzeMarketPatterns(data: CandlestickData[]): Promise<TradingSignal> {
  const prompt = `
    Analyze the following recent candlestick data for binary options trading (60s - 5min timeframe).
    Identify technical chart patterns (e.g., Support/Resistance, Pin Bar, Doji, Engulfing, RSI Divergence, etc.).
    Determine if there is a high-probability BUY or SELL signal.
    
    Data (last 20 candles):
    ${JSON.stringify(data.slice(-20), null, 2)}
    
    Response must be a JSON object matching this schema:
    {
      "type": "BUY" | "SELL" | "NEUTRAL",
      "pattern": "String name of the pattern",
      "confidence": number (0 to 1),
      "reasoning": "Brief explanation in Portuguese"
    }
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            pattern: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["type", "pattern", "confidence", "reasoning"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      type: 'NEUTRAL',
      pattern: 'Analysis Unavailable',
      confidence: 0,
      reasoning: 'Não foi possível analisar o mercado no momento.'
    };
  }
}
