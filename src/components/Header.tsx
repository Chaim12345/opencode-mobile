import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface HeaderProps {
  title: string;
  status: string;
  connected: boolean;
  busy: boolean;
  onNewChat: () => void;
  onSettings: () => void;
  onSessions: () => void;
}

export default function Header({
  title,
  status,
  connected,
  busy,
  onNewChat,
  onSettings,
  onSessions,
}: HeaderProps) {
  const dotColor = !connected ? '#f38ba8' : busy ? '#00f0ff' : '#a6e3a1';

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>qt</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={onSessions}>
          <Text style={styles.btnText}>☰</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onNewChat}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onSettings}>
          <Text style={styles.btnText}>⚙</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(18,18,48,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    minHeight: 50,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logo: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#00f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  btnText: {
    fontSize: 16,
    color: '#6c7086',
  },
});
