// types/globals.d.ts
// Global type declarations for extreme performance features

declare global {
  const __PERFORMANCE_MONITORING__: boolean;

  interface Window {
    albionWebSocket?: WebSocket;
    wasmPerformanceMarks?: PerformanceMark[];
  }

  // WebAssembly performance marks
  interface PerformanceMark {
    name: string;
    startTime: number;
    duration?: number;
  }

  // Real-time data types
  interface AlbionKillEvent {
    id: string;
    timestamp: number;
    killer: {
      name: string;
      guild?: string;
      alliance?: string;
    };
    victim: {
      name: string;
      guild?: string;
      alliance?: string;
    };
    location: string;
    value: number;
  }

  interface MarketData {
    id: string;
    name: string;
    prices: number[];
    timestamp: number;
  }

  interface BattleEvent {
    id: string;
    timestamp: number;
    winner: string;
    loser: string;
    location: string;
    totalFame: number;
  }
}

export {};
