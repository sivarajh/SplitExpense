import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ExpenseRow } from '@/components/ExpenseRow';
import { useAuth } from '@/lib/auth';
import { getGroup, getGroupData, profileMap } from '@/lib/api/groups';
import { computeBalances, simplifyDebts } from '@/lib/debts';
import { formatCurrency } from '@/lib/format';
import { qk } from '@/lib/queryClient';
import type { Expense } from '@/lib/types';
import { colors } from '@/theme/colors';
import { fontSize, radius, spacing } from '@/theme/spacing';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const userId = user!.id;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: qk.groupData(id),
    queryFn: async () => {
      const [group, groupData] = await Promise.all([getGroup(id), getGroupData(id)]);
      const balances = computeBalances(
        groupData.expenses,
        groupData.splits,
        groupData.settlements,
        groupData.members.map((m) => m.user_id)
      );
      const transfers = simplifyDebts(balances);
      return { group, ...groupData, balances, transfers };
    },
  });

  const profiles = data ? profileMap(data.members) : {};
  const nameFor = (uid: string) =>
    uid === userId ? 'You' : profiles[uid]?.full_name ?? profiles[uid]?.email ?? 'Someone';

  const renderHeader = () => {
    if (!data) return null;
    const myTransfers = data.transfers.filter((t) => t.from === userId || t.to === userId);
    return (
      <View style={styles.headerArea}>
        <View style={styles.balancesCard}>
          <Text style={styles.sectionTitle}>Balances</Text>
          {data.transfers.length === 0 ? (
            <Text style={styles.allSettled}>Everyone is settled up 🎉</Text>
          ) : (
            <>
              {/* Surface the current user's debts first. */}
              {[...myTransfers, ...data.transfers.filter((t) => !myTransfers.includes(t))].map(
                (t, idx) => {
                  const involvesMe = t.from === userId || t.to === userId;
                  return (
                    <View key={idx} style={styles.transferRow}>
                      <Text style={[styles.transferText, involvesMe && styles.transferMine]}>
                        <Text style={styles.bold}>{nameFor(t.from)}</Text>
                        {t.from === userId ? ' owe ' : ' owes '}
                        <Text style={styles.bold}>{nameFor(t.to)}</Text>
                      </Text>
                      <Text
                        style={[
                          styles.transferAmount,
                          { color: t.to === userId ? colors.positive : colors.danger },
                        ]}
                      >
                        {formatCurrency(t.amount)}
                      </Text>
                    </View>
                  );
                }
              )}
            </>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => router.push(`/group/${id}/add-expense`)}
          >
            <Ionicons name="add-circle" size={20} color={colors.textInverse} />
            <Text style={styles.actionText}>Add expense</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionSecondary,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => router.push(`/group/${id}/settle`)}
          >
            <Ionicons name="cash" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Settle up</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Expenses</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: data?.group.name ?? 'Group',
          headerRight: () => (
            <Pressable onPress={() => router.push(`/group/${id}/members`)} hitSlop={8}>
              <Ionicons name="people-outline" size={22} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <FlatList<Expense>
        data={data?.expenses ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <ExpenseRow
            expense={item}
            payerName={nameFor(item.paid_by)}
            currentUserId={userId}
            onPress={() => router.push(`/expense/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="receipt-outline"
              title="No expenses yet"
              subtitle="Add the first expense to get started."
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.sm },
  headerArea: { gap: spacing.md, marginBottom: spacing.sm },
  balancesCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  allSettled: { fontSize: fontSize.sm, color: colors.textMuted },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transferText: { fontSize: fontSize.sm, color: colors.textMuted, flexShrink: 1 },
  transferMine: { color: colors.text },
  bold: { fontWeight: '700', color: colors.text },
  transferAmount: { fontSize: fontSize.md, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  actionSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionText: { color: colors.textInverse, fontWeight: '700', fontSize: fontSize.sm },
});
