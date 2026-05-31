import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountInput } from '@/components/AmountInput';
import { Button } from '@/components/Button';
import { MemberSelect } from '@/components/MemberSelect';
import { useAuth } from '@/lib/auth';
import { listMembers } from '@/lib/api/members';
import { addSettlement } from '@/lib/api/settlements';
import { qk } from '@/lib/queryClient';
import type { Profile } from '@/lib/types';
import { colors } from '@/theme/colors';
import { fontSize, spacing } from '@/theme/spacing';

export default function SettleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = user!.id;

  const { data: members } = useQuery({
    queryKey: qk.members(id),
    queryFn: () => listMembers(id),
  });

  const profiles: Profile[] = (members ?? [])
    .map((m) => m.profile)
    .filter((p): p is Profile => !!p);

  const [fromUser, setFromUser] = useState(userId);
  const [toUser, setToUser] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const numericAmount = parseFloat(amount) || 0;
  const canSubmit = fromUser && toUser && fromUser !== toUser && numericAmount > 0;

  const mutation = useMutation({
    mutationFn: () =>
      addSettlement({ groupId: id, fromUser, toUser, amount: numericAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.groupData(id) });
      queryClient.invalidateQueries({ queryKey: [...qk.groups, 'balances'] });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      router.back();
    },
    onError: (e: any) => setError(e?.message ?? 'Could not record payment.'),
  });

  const onSubmit = () => {
    setError(null);
    if (!canSubmit) {
      setError('Pick two different people and an amount.');
      return;
    }
    mutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, title: 'Settle up', presentation: 'modal' }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Who paid</Text>
        <MemberSelect
          members={profiles}
          selectedId={fromUser}
          onSelect={setFromUser}
          currentUserId={userId}
        />

        <Text style={styles.label}>Who received</Text>
        <MemberSelect
          members={profiles.filter((p) => p.id !== fromUser)}
          selectedId={toUser}
          onSelect={setToUser}
          currentUserId={userId}
        />

        <Text style={styles.label}>Amount</Text>
        <AmountInput value={amount} onChangeText={setAmount} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title="Record payment"
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
  label: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted, marginTop: spacing.sm },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
