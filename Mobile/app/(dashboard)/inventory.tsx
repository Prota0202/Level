
// app/(dashboard)/inventory.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../src/constants/colors';

export default function InventoryScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="bag" size={64} color={Colors.textMuted} />
      <Text style={styles.title}>Inventory Screen</Text>
      <Text style={styles.subtitle}>This screen is coming soon!</Text>
      <Text style={styles.description}>
        Here you&apos;ll be able to manage your items, equipment, and rewards from completed quests.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});