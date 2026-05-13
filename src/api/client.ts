import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SsePayload,
  SessionInfo,
  SessionListItem,
  ServerConfig,
  ChatMessage,
} from './types';

const STORAGE_KEY_SESSION = 'opencode_session_id';
const STORAGE_KEY_SERVER = 'opencode_server_url';

export interface ServerUrl {
  host: string;
  port: number;
  useTls: boolean;
}

export function defaultServerUrl(): ServerUrl {
  return { host: '137.131.63.155', port: 3000, useTls: false };
}

export async function getServerUrl(): Promise<ServerUrl> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SERVER);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultServerUrl();
}

export async function setServerUrl(url: ServerUrl): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_SERVER, JSON.stringify(url));
}

function buildBaseUrl(url: ServerUrl): string {
  const proto = url.useTls ? 'https' : 'http';
  return `${proto}://${url.host}:${url.port}`;
}

async function getSessionId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY_SESSION);
  } catch {
    return null;
  }
}

async function setSessionId(id: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_SESSION, id);
}

async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const server = await getServerUrl();
  const base = buildBaseUrl(server);
  const sid = await getSessionId();
  const headers = new Headers(options.headers || {});
  if (sid) headers.set('x-qt9-session', sid);

  const res = await fetch(`${base}${path}`, { ...options, headers });
  const newSid = res.headers.get('x-qt9-session');
  if (newSid) await setSessionId(newSid);
  return res;
}

// ─── Session API ──────────────────────────────────────────

export async function getSessionInfo(): Promise<SessionInfo | null> {
  try {
    const res = await apiFetch('/api/session', { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getSessionMessages(): Promise<{
  messages: ChatMessage[];
  sessionId: string;
  busy: boolean;
  currentRequestId: string | null;
  currentThinkingText: string;
  currentAssistantText: string;
  model: string;
} | null> {
  try {
    const res = await apiFetch('/api/session/messages', { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function listSessions(): Promise<{
  sessions: SessionListItem[];
  currentSessionId: string;
} | null> {
  try {
    const res = await apiFetch('/api/sessions', { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createSession(): Promise<{
  sessionId: string;
  title: string;
  createdAt: number;
} | null> {
  try {
    const res = await apiFetch('/api/sessions', { method: 'POST' });
    if (!res.ok) return null;
    const data = await res.json();
    await setSessionId(data.sessionId);
    return data;
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<string | null> {
  try {
    const res = await apiFetch('/api/session', { method: 'DELETE' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.fallbackSessionId) await setSessionId(data.fallbackSessionId);
    return data.fallbackSessionId || null;
  } catch {
    return null;
  }
}

export async function updateSessionTitle(
  title: string,
): Promise<boolean> {
  try {
    const res = await apiFetch('/api/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Model API ────────────────────────────────────────────

export async function getModels(): Promise<string[]> {
  try {
    const res = await apiFetch('/api/models', { method: 'GET' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getConfig(): Promise<ServerConfig | null> {
  try {
    const res = await apiFetch('/api/config', { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function switchModel(model: string): Promise<boolean> {
  try {
    const res = await apiFetch('/api/model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Chat API ─────────────────────────────────────────────

export interface ChatCallbacks {
  onSession?: (payload: SsePayload & { type: 'session' }) => void;
  onStatus?: (phase: string) => void;
  onThinkingDelta?: (text: string) => void;
  onThinkingSnapshot?: (text: string) => void;
  onAssistantDelta?: (text: string) => void;
  onAssistantSnapshot?: (text: string) => void;
  onToolCall?: (tool: string, args: Record<string, unknown>) => void;
  onToolResult?: (tool: string, result: string, details?: Record<string, unknown>) => void;
  onToolError?: (tool: string, error: string) => void;
  onAssistant?: (text: string) => void;
  onError?: (message: string) => void;
  onDone?: () => void;
}

export async function sendMessage(
  message: string,
  callbacks: ChatCallbacks,
): Promise<void> {
  try {
    const res = await apiFetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      callbacks.onError?.(err.error || res.statusText);
      return;
    }

    await consumeSseStream(res, callbacks);
  } catch (e: any) {
    callbacks.onError?.(e.message || 'Network error');
  }
}

export async function cancelChat(): Promise<void> {
  try {
    await apiFetch('/api/chat/cancel', { method: 'POST' });
  } catch {}
}

export async function reattachStream(
  requestId: string,
  callbacks: ChatCallbacks,
): Promise<void> {
  try {
    const res = await apiFetch(
      `/api/chat/stream?requestId=${encodeURIComponent(requestId)}`,
      { method: 'GET' },
    );
    if (!res.ok) return;
    await consumeSseStream(res, callbacks);
  } catch {}
}

async function consumeSseStream(
  res: Response,
  callbacks: ChatCallbacks,
): Promise<void> {
  if (!res.body) {
    callbacks.onError?.('No response body');
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let streaming = true;

  try {
    while (streaming) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const raw = trimmed.slice(6).trim();
        if (!raw) continue;

        try {
          const payload = JSON.parse(raw) as SsePayload;
          handlePayload(payload, callbacks);
          if (payload.type === 'done') {
            streaming = false;
            callbacks.onDone?.();
            break;
          }
        } catch {}
      }
    }
  } catch (e: any) {
    if (streaming) {
      // If we were still expecting data, signal error
      callbacks.onError?.(e.message || 'Stream error');
    }
  }
}

function handlePayload(
  payload: SsePayload,
  cbs: ChatCallbacks,
): void {
  switch (payload.type) {
    case 'session':
      cbs.onSession?.(payload as any);
      break;
    case 'status':
      cbs.onStatus?.(payload.phase);
      break;
    case 'thinking_snapshot':
      cbs.onThinkingSnapshot?.(payload.text);
      break;
    case 'thinking_delta':
      cbs.onThinkingDelta?.(payload.text);
      break;
    case 'assistant_snapshot':
      cbs.onAssistantSnapshot?.(payload.text);
      break;
    case 'assistant_delta':
      cbs.onAssistantDelta?.(payload.text);
      break;
    case 'tool_call':
      cbs.onToolCall?.(payload.tool, payload.args);
      break;
    case 'tool_result':
      cbs.onToolResult?.(payload.tool, payload.result, payload.details);
      break;
    case 'tool_error':
      cbs.onToolError?.(payload.tool, payload.error);
      break;
    case 'assistant':
      cbs.onAssistant?.(payload.text);
      break;
    case 'error':
      cbs.onError?.(payload.message);
      break;
    case 'done':
      cbs.onDone?.();
      break;
  }
}
