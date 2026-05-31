import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { formatAbsCurrency } from '@/lib/format';
import { fontSize, radius, spacing } from '@/theme/spacing';

// Shows a net balance with sign-aware coloring and label.
// Positive => you are owed (green); negative => you owe (red); zero => settled.
export function BalancePill({ amount, compact = false }: { amount: number; compact?: boolean }) {
  const rounded = Math.round(amount * 100) / 100;
  const settled = rounded === 0;
  const owed = rounded > 0;
  const color = settled ? colors.textMuted : owed ? colors.positive : colors.danger;
  const label = settled ? 'settled up' : owed ? 'you are owed' : 'you owe';

  if (compact) {
    return (
      <Text style={[styles.compact, { color }]}>
        {settled ? 'settled' : formatAbsCurrency(rounded)}
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color }]}>{label}</Text>
      {!settled && (
        <Text style={[styles.amount, { color }]}>{formatAbsCurrency(rounded)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  compact: {
    fontSize: fontSize.md,
    fontWeight: '800',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
  },
});
