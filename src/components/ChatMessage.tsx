import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import type { ChatMessage } from '../api/types';
import { formatTimestamp, formatMarkdown } from '../utils/format';

interface ChatMessageProps {
  message: ChatMessage;
  streaming?: boolean;
}

export default function ChatMessageView({
  message,
  streaming,
}: ChatMessageProps) {
  const content = message.content || '';
  const time = formatTimestamp(message.timestamp);

  if (message.role === 'system') {
    return (
      <View style={styles.system}>
        <Text style={styles.systemText}>{content}</Text>
      </View>
    );
  }

  if (message.role === 'tool') {
    return (
      <View style={styles.tool}>
        <Text style={styles.toolName}>
          {message.tool_error ? '⚠️' : '🔧'} {message.tool_name || 'tool'}
          {message.tool_error && (
            <Text style={styles.toolError}> {message.tool_error}</Text>
          )}
        </Text>
        {message.tool_result && (
          <Text style={styles.toolResult} numberOfLines={5}>
            {message.tool_result}
          </Text>
        )}
        {message.tool_args && (
          <Text style={styles.toolArgs}>
            {JSON.stringify(message.tool_args, null, 2)}
          </Text>
        )}
        <Text style={styles.timestamp}>{time}</Text>
      </View>
    );
  }

  if (message.role === 'user') {
    return (
      <View style={styles.userContainer}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{content}</Text>
        </View>
        <Text style={styles.timestamp}>{time}</Text>
      </View>
    );
  }

  // assistant
  const formatted = formatMarkdown(content);
  return (
    <View style={styles.assistantContainer}>
      <View style={styles.assistantBubble}>
        {formatted ? (
          <Text style={styles.assistantText}>{formatted}</Text>
        ) : streaming ? (
          <View style={styles.thinkingRow}>
            <ActivityIndicator size="small" color="#00f0ff" />
            <Text style={styles.thinkingText}>Thinking...</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.timestamp}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  system: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  systemText: {
    color: '#6c7086',
    fontSize: 11,
    fontStyle: 'italic',
  },
  tool: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,179,135,0.06)',
    borderLeftWidth: 2,
    borderLeftColor: '#f59e0b',
    borderRadius: 6,
    padding: 8,
    marginVertical: 2,
    marginHorizontal: 16,
    maxWidth: '90%',
  },
  toolName: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  toolError: {
    color: '#f38ba8',
  },
  toolResult: {
    fontSize: 11,
    color: '#a6e3a1',
    marginTop: 4,
  },
  toolArgs: {
    fontSize: 10,
    color: '#6c7086',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  timestamp: {
    fontSize: 10,
    color: '#6c7086',
    opacity: 0.5,
    marginTop: 4,
  },
  userContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  userBubble: {
    backgroundColor: 'rgba(124,58,237,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
    borderRadius: 12,
    borderBottomRightRadius: 4,
    padding: 12,
    maxWidth: '85%',
  },
  userText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 21,
  },
  assistantContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  assistantBubble: {
    backgroundColor: 'rgba(18,18,48,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderBottomLeftRadius: 4,
    padding: 12,
    maxWidth: '85%',
  },
  assistantText: {
    color: '#cdd6f4',
    fontSize: 15,
    lineHeight: 21,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    color: '#6c7086',
    fontSize: 13,
    fontStyle: 'italic',
  },
});
