/**
 * Socket.io Client Configuration
 * Handles real-time communication with the automation engine
 */

import { io, Socket } from 'socket.io-client';

// Event types for type-safe communication
export interface AutomationStatus {
  state: 'idle' | 'running' | 'paused' | 'error';
  currentTask?: string;
  progress?: number;
  totalJobs?: number;
  processedJobs?: number;
  platform?: 'linkedin' | 'indeed' | 'both';
  startedAt?: string;
  lastActivity?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, unknown>;
}

export interface ApplicationUpdate {
  id: string;
  jobId: string;
  status: string;
  updatedAt: string;
  company?: string;
  title?: string;
}

export interface JobDiscoveryUpdate {
  type: 'new' | 'match' | 'skip';
  job: {
    id: string;
    title: string;
    company: string;
    matchScore?: number;
  };
}

export interface ScreenshotUpdate {
  timestamp: string;
  url: string;
  dataUrl: string;
}

// Socket event map for type safety
export interface ServerToClientEvents {
  'automation:status': (status: AutomationStatus) => void;
  'automation:log': (log: LogEntry) => void;
  'automation:screenshot': (screenshot: ScreenshotUpdate) => void;
  'application:update': (update: ApplicationUpdate) => void;
  'job:discovery': (update: JobDiscoveryUpdate) => void;
  'connection:established': (data: { clientId: string }) => void;
  'error': (error: { message: string; code: string }) => void;
}

export interface ClientToServerEvents {
  'automation:start': (config: {
    platforms: ('linkedin' | 'indeed')[];
    searchQuery?: string;
    maxApplications?: number;
  }) => void;
  'automation:stop': () => void;
  'automation:pause': () => void;
  'automation:resume': () => void;
  'subscribe:logs': (options?: { level?: LogEntry['level'] }) => void;
  'unsubscribe:logs': () => void;
}

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/**
 * Get or create socket connection
 */
export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

    socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });
  }

  return socket;
}

/**
 * Connect to the socket server
 */
export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

/**
 * Disconnect from the socket server
 */
export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
