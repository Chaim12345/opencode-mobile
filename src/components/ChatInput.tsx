import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface ChatInputProps {
  onSend: (text: string) => void;
  onCancel: () => void;
  streaming: boolean;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
  onCancel,
  streaming,
  disabled,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const msg = text.trim();
    if (!msg || streaming) return;
    setText('');
    onSend(msg);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message the agent..."
            placeholderTextColor="#6c7086"
            multiline
            maxLength={10000}
            editable={!streaming && !disabled}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Enter') {
                handleSend();
              }
            }}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.button,
            streaming ? styles.stopButton : styles.sendButton,
          ]}
          onPress={streaming ? handleCancel : handleSend}
          disabled={disabled && !streaming}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>{streaming ? '■' : '→'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: 'rgba(18,18,48,0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
  },
  input: {
    color: '#cdd6f4',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 120,
    minHeight: 44,
    lineHeight: 22,
  },
  button: {
    width: 48,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    backgroundColor: '#00f0ff',
  },
  stopButton: {
    backgroundColor: 'rgba(243,139,168,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(243,139,168,0.5)',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
});
