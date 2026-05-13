// ─── SSE event types from qt9-server ──────────────────────

export interface SseSessionPayload {
  type: 'session';
  requestId: string;
  sessionId: string;
  model: string;
}

export interface SseStatusPayload {
  type: 'status';
  requestId: string;
  sessionId: string;
  phase: string;
}

export interface SseThinkingDeltaPayload {
  type: 'thinking_delta';
  requestId: string;
  sessionId: string;
  text: string;
  timestamp?: number;
}

export interface SseThinkingSnapshotPayload {
  type: 'thinking_snapshot';
  requestId: string;
  sessionId: string;
  text: string;
  timestamp?: number;
}

export interface SseAssistantDeltaPayload {
  type: 'assistant_delta';
  requestId: string;
  sessionId: string;
  text: string;
  timestamp?: number;
}

export interface SseAssistantSnapshotPayload {
  type: 'assistant_snapshot';
  requestId: string;
  sessionId: string;
  text: string;
  timestamp?: number;
}

export interface SseToolCallPayload {
  type: 'tool_call';
  requestId: string;
  sessionId: string;
  tool: string;
  args: Record<string, unknown>;
  timestamp?: number;
}

export interface SseToolResultPayload {
  type: 'tool_result';
  requestId: string;
  sessionId: string;
  tool: string;
  result: string;
  details?: Record<string, unknown>;
  timestamp?: number;
}

export interface SseToolErrorPayload {
  type: 'tool_error';
  requestId: string;
  sessionId: string;
  tool: string;
  error: string;
  timestamp?: number;
}

export interface SseAssistantPayload {
  type: 'assistant';
  requestId: string;
  sessionId: string;
  text: string;
  timestamp?: number;
}

export interface SseErrorPayload {
  type: 'error';
  requestId: string;
  sessionId: string;
  message: string;
  timestamp?: number;
}

export interface SseDonePayload {
  type: 'done';
  requestId: string;
  sessionId: string;
}

export type SsePayload =
  | SseSessionPayload
  | SseStatusPayload
  | SseThinkingDeltaPayload
  | SseThinkingSnapshotPayload
  | SseAssistantDeltaPayload
  | SseAssistantSnapshotPayload
  | SseToolCallPayload
  | SseToolResultPayload
  | SseToolErrorPayload
  | SseAssistantPayload
  | SseErrorPayload
  | SseDonePayload;

// ─── Chat message types ───────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_name?: string;
  tool_args?: Record<string, unknown>;
  tool_result?: string;
  tool_error?: string;
  timestamp?: number;
}

// ─── Session types ────────────────────────────────────────

export interface SessionInfo {
  sessionId: string;
  title: string;
  model: string;
  busy: boolean;
  createdAt: number;
  currentRequestId: string | null;
  currentThinkingText: string;
  currentAssistantText: string;
}

export interface SessionListItem {
  id: string;
  title: string;
  busy: boolean;
  messageCount: number;
  createdAt: number;
  lastAccessedAt: number;
  model: string;
}

export interface ServerConfig {
  model: string;
  theme?: string;
  maxSteps?: number;
  sandboxMode?: boolean;
  [key: string]: unknown;
}
