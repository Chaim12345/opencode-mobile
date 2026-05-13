import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);

  if (showSettings) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <SettingsScreen onClose={() => setShowSettings(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ChatScreen onOpenSettings={() => setShowSettings(true)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
});
