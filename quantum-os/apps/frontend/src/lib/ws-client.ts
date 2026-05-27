import { WSEventType, WSEventPayload } from '@quantum-os/shared';

type EventHandler = (data: unknown) => void;

export class WebSocketClient {
  private static instance: WebSocketClient;
  private ws: WebSocket | null = null;
  private handlers: Map<WSEventType, Set<EventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentUrl: string | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private openResolvers: Array<() => void> = [];
  private openRejectors: Array<(error: Error) => void> = [];

  private constructor() {}

  public static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  public connect(url: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.currentUrl = url;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.log(`WebSocket connected to ${url}`);
      this.openResolvers.splice(0).forEach(resolve => resolve());
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const rawData = event.data;
      if (typeof rawData === 'string' && (rawData.startsWith('ping:') || rawData.startsWith('pong:'))) {
        return;
      }

      try {
        const payload = JSON.parse(rawData) as WSEventPayload;
        const eventHandlers = this.handlers.get(payload.event);
        if (eventHandlers) {
          eventHandlers.forEach(handler => handler(payload.data));
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      this.handleReconnect();
    };

    this.ws.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
      this.openRejectors.splice(0).forEach(reject => reject(new Error('WebSocket error')));
      this.ws?.close();
    };
  }

  public async connectAndWait(url: string, timeoutMs = 5000): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.connect(url);

    if (this.ws?.readyState === WebSocket.OPEN) return;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.openResolvers = this.openResolvers.filter((item) => item !== resolve);
        this.openRejectors = this.openRejectors.filter((item) => item !== reject);
        reject(new Error(`WebSocket connection timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      const cleanup = () => clearTimeout(timeout);
      this.openResolvers.push(() => {
        cleanup();
        resolve();
      });
      this.openRejectors.push((error) => {
        cleanup();
        reject(error);
      });
    });
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.currentUrl = null;
    this.openResolvers = [];
    this.openRejectors = [];
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public get readyState(): number {
    return this.ws ? this.ws.readyState : 3; // 3 is CLOSED
  }

  public on(event: WSEventType, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  public off(event: WSEventType, handler: EventHandler): void {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers) return;
    eventHandlers.delete(handler);
    if (eventHandlers.size === 0) {
      this.handlers.delete(event);
    }
  }

  public emit(event: WSEventType, payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WSEventPayload = { event, data: payload };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open. Cannot emit event:', event);
    }
  }

  private handleReconnect(): void {
    if (!this.currentUrl || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket max reconnect attempts reached or disconnected manually.');
      return;
    }

    const backoffMs = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`WebSocket reconnecting in ${backoffMs}ms (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.currentUrl) {
        this.connect(this.currentUrl);
      }
    }, backoffMs);
  }
}

export const wsClient = WebSocketClient.getInstance();
