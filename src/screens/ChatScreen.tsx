import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  AppState,
  AppStateStatus,
} from 'react-native';
import Header from '../components/Header';
import ChatMessageView from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import type { ChatMessage } from '../api/types';
import {
  getSessionInfo,
  getSessionMessages,
  sendMessage,
  cancelChat,
  createSession,
  reattachStream,
} from '../api/client';

export default function ChatScreen({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const assistantRef = useRef<ChatMessage | null>(null);
  const thinkingRef = useRef<ChatMessage | null>(null);

  // Load session on mount
  useEffect(() => {
    loadSession();

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        loadSession();
      }
    });
    return () => sub.remove();
  }, []);

  async function loadSession() {
    try {
      const info = await getSessionInfo();
      if (!info) {
        setConnected(false);
        return;
      }
      setConnected(true);
      setBusy(info.busy);
      setLoading(true);

      const data = await getSessionMessages();
      if (data) {
        const msgs: ChatMessage[] = data.messages || [];
        setMessages(msgs);
        setStreaming(data.busy);
        setCurrentRequestId(data.currentRequestId);

        if (data.busy && data.currentRequestId) {
          handleReattach(data.currentRequestId);
        }
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }

  function handleReattach(requestId: string) {
    reattachStream(requestId, {
      onAssistantSnapshot: (text: string) => {
        setMessages(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(m => m.role === 'assistant' && m.tool_name === undefined);
          if (idx >= 0) {
            copy[idx] = { ...copy[idx], content: text };
          } else {
            copy.push({ role: 'assistant', content: text, timestamp: Date.now() });
          }
          return copy;
        });
      },
      onThinkingSnapshot: (text: string) => {
        setMessages(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(m => m.role === 'tool' && m.tool_name === 'Thinking');
          if (idx >= 0) {
            copy[idx] = { ...copy[idx], content: text };
          } else {
            copy.push({
              role: 'tool',
              content: text,
              tool_name: 'Thinking',
              timestamp: Date.now(),
            });
          }
          return copy;
        });
      },
      onAssistantDelta: (text: string) => {
        setMessages(prev => {
          const copy = [...prev];
          let assistant = copy.find(m => m.role === 'assistant');
          if (assistant) {
            assistant.content += text;
          } else {
            copy.push({ role: 'assistant', content: text, timestamp: Date.now() });
          }
          return [...copy];
        });
      },
      onToolCall: (tool: string, args: Record<string, unknown>) => {
        setMessages(prev => [
          ...prev,
          {
            role: 'tool',
            content: '',
            tool_name: tool,
            tool_args: args,
            timestamp: Date.now(),
          },
        ]);
      },
      onToolResult: (tool: string, result: string) => {
        setMessages(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(
            m => m.role === 'tool' && m.tool_name === tool,
          );
          if (idx >= 0) {
            copy[idx] = { ...copy[idx], tool_result: result };
          }
          return copy;
        });
      },
      onToolError: (tool: string, error: string) => {
        setMessages(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(
            m => m.role === 'tool' && m.tool_name === tool,
          );
          if (idx >= 0) {
            copy[idx] = { ...copy[idx], tool_error: error };
          }
          return copy;
        });
      },
      onDone: () => {
        setStreaming(false);
        setBusy(false);
        setCurrentRequestId(null);
      },
      onError: () => {
        setStreaming(false);
        setBusy(false);
      },
    });
  }

  const handleSend = useCallback(
    async (text: string) => {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: text, timestamp: Date.now() },
      ]);

      setStreaming(true);
      setBusy(true);

      sendMessage(text, {
        onSession: payload => {
          setCurrentRequestId(payload.requestId);
        },
        onStatus: phase => {
          setBusy(true);
        },
        onThinkingSnapshot: (text: string) => {
          thinkingRef.current = {
            role: 'tool',
            content: text,
            tool_name: 'Thinking',
            timestamp: Date.now(),
          };
          setMessages(prev => {
            const copy = [...prev];
            const existing = copy.findIndex(m => m.role === 'tool' && m.tool_name === 'Thinking');
            if (existing >= 0) {
              copy[existing] = thinkingRef.current!;
            } else {
              copy.push(thinkingRef.current!);
            }
            return copy;
          });
        },
        onThinkingDelta: (delta: string) => {
          if (thinkingRef.current) {
            thinkingRef.current.content += delta;
            setMessages(prev => {
              const copy = [...prev];
              const idx = copy.findIndex(m => m === thinkingRef.current || (m.role === 'tool' && m.tool_name === 'Thinking'));
              if (idx >= 0) copy[idx] = { ...thinkingRef.current! };
              return copy;
            });
          }
        },
        onAssistantDelta: (delta: string) => {
          if (!assistantRef.current) {
            assistantRef.current = {
              role: 'assistant',
              content: '',
              timestamp: Date.now(),
            };
            setMessages(prev => [...prev, assistantRef.current!]);
          }
          const msg = assistantRef.current;
          msg.content += delta;
          setMessages(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(m => m === msg);
            if (idx >= 0) copy[idx] = { ...msg };
            else copy.push({ ...msg });
            return copy;
          });
        },
        onAssistantSnapshot: (text: string) => {
          assistantRef.current = {
            role: 'assistant',
            content: text,
            timestamp: Date.now(),
          };
          setMessages(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(m => m.role === 'assistant');
            if (idx >= 0) copy[idx] = assistantRef.current!;
            else copy.push(assistantRef.current!);
            return copy;
          });
        },
        onToolCall: (tool: string, args: Record<string, unknown>) => {
          assistantRef.current = null;
          const toolMsg: ChatMessage = {
            role: 'tool',
            content: '',
            tool_name: tool,
            tool_args: args,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, toolMsg]);
        },
        onToolResult: (tool: string, result: string, details?: Record<string, unknown>) => {
          setMessages(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(m => m.role === 'tool' && m.tool_name === tool);
            if (idx >= 0) copy[idx] = { ...copy[idx], tool_result: result };
            return copy;
          });
        },
        onToolError: (tool: string, error: string) => {
          setMessages(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(m => m.role === 'tool' && m.tool_name === tool);
            if (idx >= 0) copy[idx] = { ...copy[idx], tool_error: error };
            return copy;
          });
        },
        onAssistant: (text: string) => {
          assistantRef.current = null;
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: text, timestamp: Date.now() },
          ]);
        },
        onError: (message: string) => {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: `Error: ${message}`, timestamp: Date.now() },
          ]);
          setStreaming(false);
          setBusy(false);
        },
        onDone: () => {
          assistantRef.current = null;
          thinkingRef.current = null;
          setStreaming(false);
          setBusy(false);
          setCurrentRequestId(null);
        },
      });
    },
    [],
  );

  const handleCancel = useCallback(async () => {
    await cancelChat();
    setStreaming(false);
    setBusy(false);
  }, []);

  const handleNewChat = useCallback(async () => {
    await createSession();
    setMessages([]);
    setStreaming(false);
    setBusy(false);
    assistantRef.current = null;
    thinkingRef.current = null;
  }, []);

  function scrollToBottom() {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <View style={styles.container}>
      <Header
        title="OpenCode"
        status={connected ? (busy ? 'busy' : 'connected') : 'disconnected'}
        connected={connected}
        busy={busy}
        onNewChat={handleNewChat}
        onSettings={onOpenSettings}
        onSessions={handleNewChat}
      />

      <FlatList
        ref={flatListRef}
        style={styles.messageList}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <ChatMessageView
            message={item}
            streaming={streaming && item.role === 'assistant'}
          />
        )}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
      />

      <ChatInput
        onSend={handleSend}
        onCancel={handleCancel}
        streaming={streaming}
        disabled={!connected || loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  messageList: {
    flex: 1,
  },
});
