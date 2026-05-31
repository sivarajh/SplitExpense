import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { formatCurrency } from '@/lib/format';
import { splitByExact, splitByPercent, splitEqual } from '@/lib/splits';
import type { Profile, SplitMode, SplitShare } from '@/lib/types';
import { colors } from '@/theme/colors';
import { fontSize, radius, spacing } from '@/theme/spacing';

export interface SplitResult {
  shares: SplitShare[];
  valid: boolean;
  error?: string;
}

interface SplitEditorProps {
  amount: number;
  members: Profile[];
  currentUserId: string;
  onChange: (result: SplitResult) => void;
}

const MODES: { key: SplitMode; label: string }[] = [
  { key: 'equal', label: 'Equally' },
  { key: 'exact', label: 'Exact' },
  { key: 'percent', label: '%' },
];

// Controlled split editor. Lets the user pick participants and a split mode,
// computes shares via the pure helpers in lib/splits, and reports the result.
export function SplitEditor({ amount, members, currentUserId, onChange }: SplitEditorProps) {
  const [mode, setMode] = useState<SplitMode>('equal');
  const [participants, setParticipants] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(members.map((m) => [m.id, true]))
  );
  const [exactValues, setExactValues] = useState<Record<string, string>>({});
  const [percentValues, setPercentValues] = useState<Record<string, string>>({});

  const selectedIds = useMemo(
    () => members.map((m) => m.id).filter((id) => participants[id]),
    [members, participants]
  );

  const result = useMemo<SplitResult>(() => {
    if (selectedIds.length === 0) {
      return { shares: [], valid: false, error: 'Select at least one person.' };
    }
    if (mode === 'equal') {
      return { shares: splitEqual(amount, selectedIds), valid: true };
    }
    if (mode === 'exact') {
      const amounts = Object.fromEntries(
        selectedIds.map((id) => [id, parseFloat(exactValues[id] ?? '') || 0])
      );
      const { shares, error } = splitByExact(amount, amounts);
      return { shares, valid: !error, error };
    }
    const percents = Object.fromEntries(
      selectedIds.map((id) => [id, parseFloat(percentValues[id] ?? '') || 0])
    );
    const { shares, error } = splitByPercent(amount, percents);
    return { shares, valid: !error, error };
  }, [mode, amount, selectedIds, exactValues, percentValues]);

  // Report upward. Depend on a serialized snapshot to avoid effect loops.
  const snapshot = JSON.stringify(result);
  useEffect(() => {
    onChange(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  const shareFor = (id: string) => result.shares.find((s) => s.userId === id)?.amount ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {MODES.map((m) => (
          <Pressable
            key={m.key}
            onPress={() => setMode(m.key)}
            style={[styles.tab, mode === m.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, mode === m.key && styles.tabTextActive]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      {members.map((m) => {
        const selected = !!participants[m.id];
        return (
          <View key={m.id} style={styles.memberRow}>
            <Pressable
              onPress={() => setParticipants((p) => ({ ...p, [m.id]: !p[m.id] }))}
              style={styles.checkArea}
            >
              <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                {selected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Avatar name={m.full_name} email={m.email} size={32} />
              <Text style={styles.name} numberOfLines={1}>
                {m.id === currentUserId ? 'You' : m.full_name ?? m.email}
              </Text>
            </Pressable>

            {selected && mode === 'exact' && (
              <TextInput
                value={exactValues[m.id] ?? ''}
                onChangeText={(t) =>
                  setExactValues((v) => ({ ...v, [m.id]: t.replace(/[^0-9.]/g, '') }))
                }
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={styles.smallInput}
              />
            )}
            {selected && mode === 'percent' && (
              <TextInput
                value={percentValues[m.id] ?? ''}
                onChangeText={(t) =>
                  setPercentValues((v) => ({ ...v, [m.id]: t.replace(/[^0-9.]/g, '') }))
                }
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={styles.smallInput}
              />
            )}
            {selected && (
              <Text style={styles.shareText}>{formatCurrency(shareFor(m.id))}</Text>
            )}
          </View>
        );
      })}

      {result.error ? <Text style={styles.error}>{result.error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.card,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primaryDark,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '900',
  },
  name: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  smallInput: {
    width: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'right',
  },
  shareText: {
    minWidth: 64,
    textAlign: 'right',
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
