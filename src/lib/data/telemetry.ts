/**
 * Real-Time Telemetry WebSocket Client
 * 
 * For live race weekend data updates:
 * - FastF1 live timing data
 * - F1 official timing data (requires API access)
 * - Custom WebSocket service
 * 
 * Usage:
 * ```typescript
 * import { createTelemetryClient } from '@/lib/data/telemetry';
 * 
 * const client = createTelemetryClient('wss://your-telemetry-service.com');
 * client.on('position', (data) => {
 *   console.log('Position update:', data);
 * });
 * client.connect();
 * ```
 */

export interface TelemetryMessage {
  type: 'position' | 'lap' | 'sector' | 'flag' | 'safety_car' | 'pit' | 'weather';
  timestamp: number;
  sessionKey?: number;
  driverNumber?: number;
  data: any;
}

export interface TelemetryClient {
  connect: () => void;
  disconnect: () => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
  isConnected: () => boolean;
}

class TelemetryClientImpl implements TelemetryClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private shouldReconnect = true;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[Telemetry] Already connected');
      return;
    }

    console.log(`[Telemetry] 🔌 Connecting to ${this.url}...`);
    
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[Telemetry] ✅ Connected');
        this.reconnectAttempts = 0;
        this.emit('connect', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const message: TelemetryMessage = JSON.parse(event.data);
          console.log(`[Telemetry] 📨 Received ${message.type}:`, message);
          this.emit(message.type, message.data);
          this.emit('message', message);
        } catch (error) {
          console.error('[Telemetry] ❌ Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[Telemetry] ❌ WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = (event) => {
        console.log(`[Telemetry] 🔌 Disconnected (code: ${event.code}, reason: ${event.reason})`);
        this.emit('disconnect', { code: event.code, reason: event.reason });
        
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          console.log(`[Telemetry] 🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connect(), delay);
        }
      };
    } catch (error) {
      console.error('[Telemetry] ❌ Failed to create WebSocket:', error);
      this.emit('error', error);
    }
  }

  disconnect(): void {
    console.log('[Telemetry] 🔌 Disconnecting...');
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[Telemetry] ❌ Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Create a new telemetry WebSocket client
 * 
 * @param url WebSocket server URL (e.g., 'wss://your-telemetry-service.com')
 * @returns TelemetryClient instance
 * 
 * @example
 * ```typescript
 * const client = createTelemetryClient('wss://api.example.com/telemetry');
 * 
 * client.on('position', (data) => {
 *   console.log('Position update:', data);
 * });
 * 
 * client.on('lap', (data) => {
 *   console.log('Lap time:', data);
 * });
 * 
 * client.connect();
 * 
 * // Later...
 * client.disconnect();
 * ```
 */
export const createTelemetryClient = (url: string): TelemetryClient => {
  return new TelemetryClientImpl(url);
};

/**
 * React hook for telemetry data
 * 
 * @example
 * ```typescript
 * const { positions, isConnected } = useTelemetry('wss://api.example.com/telemetry');
 * ```
 */
/**
 * React hook for telemetry data
 * 
 * Note: The React hook version is implemented in src/hooks/useTelemetry.ts
 * This function is kept for backward compatibility but redirects to the hook implementation.
 * 
 * @param _url WebSocket server URL
 * @deprecated Use the hook from '@/hooks/useTelemetry' instead
 * 
 * @example
 * ```typescript
 * // Recommended: Use the hook directly
 * import { useTelemetry } from '@/hooks/useTelemetry';
 * const { positions, isConnected } = useTelemetry('wss://api.example.com/telemetry');
 * 
 * // Or use createTelemetryClient for imperative access
 * import { createTelemetryClient } from '@/lib/data/telemetry';
 * const client = createTelemetryClient('wss://api.example.com/telemetry');
 * ```
 */
export const useTelemetry = (_url: string) => {
  throw new Error('useTelemetry from telemetry.ts is deprecated. Import from "@/hooks/useTelemetry" instead.');
};

