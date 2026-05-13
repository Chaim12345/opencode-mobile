import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import {
  getServerUrl,
  setServerUrl,
  type ServerUrl,
  getModels,
  switchModel,
  getConfig,
} from '../api/client';

export default function SettingsScreen({
  onClose,
}: {
  onClose: () => void;
}) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('3000');
  const [useTls, setUseTls] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    loadSettings();
    loadModels();
  }, []);

  async function loadSettings() {
    const url = await getServerUrl();
    setHost(url.host);
    setPort(String(url.port));
    setUseTls(url.useTls);
  }

  async function loadModels() {
    setLoadingModels(true);
    try {
      const [modelList, config] = await Promise.all([
        getModels(),
        getConfig(),
      ]);
      setModels(modelList);
      if (config?.model) setCurrentModel(config.model);
    } catch {
    } finally {
      setLoadingModels(false);
    }
  }

  async function handleSave() {
    const url: ServerUrl = {
      host: host.trim() || 'localhost',
      port: parseInt(port, 10) || 3000,
      useTls,
    };
    await setServerUrl(url);
    setSaveMsg('Saved! Restart chat to use new server.');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  async function handleSwitchModel(model: string) {
    const ok = await switchModel(model);
    if (ok) {
      setCurrentModel(model);
      setSaveMsg(`Switched to ${model}`);
      setTimeout(() => setSaveMsg(''), 2000);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Server Connection</Text>

        <Text style={styles.label}>Host</Text>
        <TextInput
          style={styles.input}
          value={host}
          onChangeText={setHost}
          placeholder="IP or hostname"
          placeholderTextColor="#6c7086"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Port</Text>
        <TextInput
          style={styles.input}
          value={port}
          onChangeText={setPort}
          placeholder="3000"
          placeholderTextColor="#6c7086"
          keyboardType="number-pad"
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Use TLS (HTTPS)</Text>
          <Switch
            value={useTls}
            onValueChange={setUseTls}
            trackColor={{ false: '#333', true: 'rgba(0,240,255,0.3)' }}
            thumbColor={useTls ? '#00f0ff' : '#6c7086'}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>

        {saveMsg ? (
          <Text style={styles.saveMsg}>{saveMsg}</Text>
        ) : null}

        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Model</Text>

        {loadingModels ? (
          <ActivityIndicator color="#00f0ff" style={{ marginVertical: 12 }} />
        ) : models.length > 0 ? (
          <Text style={styles.currentModel}>
            Current: {currentModel || 'unknown'}
          </Text>
        ) : null}

        {models.map(model => (
          <TouchableOpacity
            key={model}
            style={[
              styles.modelItem,
              model === currentModel && styles.modelItemActive,
            ]}
            onPress={() => handleSwitchModel(model)}
          >
            <Text
              style={[
                styles.modelItemText,
                model === currentModel && styles.modelItemTextActive,
              ]}
            >
              {model}
            </Text>
            {model === currentModel && (
              <Text style={styles.modelCheck}>✓</Text>
            )}
          </TouchableOpacity>
        ))}

        {models.length === 0 && !loadingModels && (
          <Text style={styles.noModels}>
            Connect to the server and save settings first.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(18,18,48,0.85)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#6c7086',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00f0ff',
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 13,
    color: '#cdd6f4',
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    color: '#cdd6f4',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: 'rgba(0,240,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.3)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#00f0ff',
    fontSize: 15,
    fontWeight: '600',
  },
  saveMsg: {
    color: '#a6e3a1',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  currentModel: {
    color: '#cdd6f4',
    fontSize: 13,
    marginBottom: 8,
    opacity: 0.7,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modelItemActive: {
    backgroundColor: 'rgba(0,240,255,0.06)',
    borderColor: 'rgba(0,240,255,0.15)',
  },
  modelItemText: {
    color: '#cdd6f4',
    fontSize: 14,
  },
  modelItemTextActive: {
    color: '#00f0ff',
    fontWeight: '500',
  },
  modelCheck: {
    color: '#00f0ff',
    fontSize: 16,
  },
  noModels: {
    color: '#6c7086',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
});
