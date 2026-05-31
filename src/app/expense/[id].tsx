import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { deleteExpense, getExpense } from '@/lib/api/expenses';
import { formatCurrency, formatDate } from '@/lib/format';
import { qk } from '@/lib/queryClient';
import { colors } from '@/theme/colors';
import { fontSize, radius, spacing } from '@/theme/spacing';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => getExpense(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteExpense(id),
    onSuccess: () => {
      if (expense) queryClient.invalidateQueries({ queryKey: qk.groupData(expense.group_id) });
      queryClient.invalidateQueries({ queryKey: [...qk.groups, 'balances'] });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      router.back();
    },
    onError: (e: any) => Alert.alert('Error', e?.message ?? 'Could not delete.'),
  });

  const confirmDelete = () => {
    Alert.alert('Delete expense', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  const nameFor = (uid: string, name?: string | null, email?: string) =>
    uid === user?.id ? 'You' : name ?? email ?? 'Someone';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: 'Expense' }} />
      {!expense ? (
        isLoading ? null : <Text style={styles.empty}>Expense not found.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.hero}>
            <Ionicons name="receipt" size={32} color={colors.primary} />
            <Text style={styles.description}>{expense.description}</Text>
            <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
            <Text style={styles.meta}>
              {nameFor(expense.paid_by, expense.payer?.full_name, expense.payer?.email)} paid ·{' '}
              {formatDate(expense.expense_date)}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Split</Text>
          <View style={styles.card}>
            {(expense.splits ?? []).map((s) => (
              <View key={s.id} style={styles.splitRow}>
                <Avatar name={s.profile?.full_name} email={s.profile?.email} size={32} />
                <Text style={styles.splitName}>
                  {nameFor(s.user_id, s.profile?.full_name, s.profile?.email)}
                </Text>
                <Text style={styles.splitAmount}>{formatCurrency(s.amount)}</Text>
              </View>
            ))}
          </View>

          <Button title="Delete expense" variant="danger" onPress={confirmDelete} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.textMuted },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  description: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  amount: { fontSize: fontSize.xxl, fontWeight: '900', color: colors.primary },
  meta: { fontSize: fontSize.sm, color: colors.textMuted },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  splitName: { flex: 1, fontSize: fontSize.md, color: colors.text },
  splitAmount: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
});
