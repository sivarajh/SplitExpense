import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountInput } from '@/components/AmountInput';
import { Button } from '@/components/Button';
import { MemberSelect } from '@/components/MemberSelect';
import { SplitEditor, type SplitResult } from '@/components/SplitEditor';
import { useAuth } from '@/lib/auth';
import { addExpense } from '@/lib/api/expenses';
import { listMembers } from '@/lib/api/members';
import { qk } from '@/lib/queryClient';
import { todayISODate } from '@/lib/format';
import type { Profile } from '@/lib/types';
import { colors } from '@/theme/colors';
import { fontSize, radius, spacing } from '@/theme/spacing';

export default function AddExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = user!.id;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(userId);
  const [split, setSplit] = useState<SplitResult>({ shares: [], valid: false });
  const [error, setError] = useState<string | null>(null);

  const numericAmount = parseFloat(amount) || 0;

  const { data: members } = useQuery({
    queryKey: qk.members(id),
    queryFn: () => listMembers(id),
  });

  const profiles: Profile[] = (members ?? [])
    .map((m) => m.profile)
    .filter((p): p is Profile => !!p);

  const mutation = useMutation({
    mutationFn: () =>
      addExpense({
        groupId: id,
        description,
        amount: numericAmount,
        paidBy,
        expenseDate: todayISODate(),
        splits: split.shares,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.groupData(id) });
      queryClient.invalidateQueries({ queryKey: [...qk.groups, 'balances'] });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      router.back();
    },
    onError: (e: any) => setError(e?.message ?? 'Could not save expense.'),
  });

  const canSubmit = description.trim().length > 0 && numericAmount > 0 && split.valid;

  const onSubmit = () => {
    setError(null);
    if (!canSubmit) {
      setError('Enter a description, amount, and a valid split.');
      return;
    }
    mutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, title: 'Add expense', presentation: 'modal' }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.input}
          placeholder="What was it for?"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />

        <AmountInput value={amount} onChangeText={setAmount} autoFocus={false} />

        <Text style={styles.label}>Paid by</Text>
        <MemberSelect
          members={profiles}
          selectedId={paidBy}
          onSelect={setPaidBy}
          currentUserId={userId}
        />

        <Text style={styles.label}>Split</Text>
        {profiles.length > 0 && (
          <SplitEditor
            amount={numericAmount}
            members={profiles}
            currentUserId={userId}
            onChange={setSplit}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title="Save expense"
          onPress={onSubmit}
          loading={mutation.isPending}
          disabled={!canSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
  },
  label: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted, marginTop: spacing.sm },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
