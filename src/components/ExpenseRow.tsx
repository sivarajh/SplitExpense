import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Expense } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { colors } from '@/theme/colors';
import { fontSize, radius, spacing } from '@/theme/spacing';

interface ExpenseRowProps {
  expense: Expense;
  payerName: string;
  currentUserId: string;
  onPress?: () => void;
}

// Renders one expense with the current user's involvement (lent / borrowed).
export function ExpenseRow({ expense, payerName, currentUserId, onPress }: ExpenseRowProps) {
  const myShare = (expense.splits ?? [])
    .filter((s) => s.user_id === currentUserId)
    .reduce((acc, s) => acc + s.amount, 0);
  const paid = expense.paid_by === currentUserId ? expense.amount : 0;
  const net = paid - myShare; // positive => you lent, negative => you borrowed

  const settled = Math.round(net * 100) === 0;
  const lent = net > 0;
  const involvementColor = settled ? colors.textMuted : lent ? colors.positive : colors.danger;
  const involvementLabel = settled ? 'not involved' : lent ? 'you lent' : 'you borrowed';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.icon}>
        <Ionicons name="receipt-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.description} numberOfLines={1}>
          {expense.description}
        </Text>
        <Text style={styles.meta}>
          {payerName} paid {formatCurrency(expense.amount)} · {formatDate(expense.expense_date)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.invLabel, { color: involvementColor }]}>{involvementLabel}</Text>
        {!settled && (
          <Text style={[styles.invAmount, { color: involvementColor }]}>
            {formatCurrency(Math.abs(net))}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: '#E7F8F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  description: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  invLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  invAmount: {
    fontSize: fontSize.md,
    fontWeight: '800',
  },
});
