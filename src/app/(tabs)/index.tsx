import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { GroupRow } from '@/components/GroupRow';
import { useAuth } from '@/lib/auth';
import { getGroupData, listMyGroups } from '@/lib/api/groups';
import { balanceFor, computeBalances } from '@/lib/debts';
import { formatAbsCurrency } from '@/lib/format';
import { qk } from '@/lib/queryClient';
import { colors } from '@/theme/colors';
import { fontSize, radius, spacing } from '@/theme/spacing';

export default function GroupsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const userId = user!.id;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [...qk.groups, 'balances'],
    queryFn: async () => {
      const groups = await listMyGroups();
      const withBalances = await Promise.all(
        groups.map(async (group) => {
          const { members, expenses, splits, settlements } = await getGroupData(group.id);
          const balances = computeBalances(
            expenses,
            splits,
            settlements,
            members.map((m) => m.user_id)
          );
          return { group, balance: balanceFor(balances, userId) };
        })
      );
      const total = withBalances.reduce((acc, g) => acc + g.balance, 0);
      return { groups: withBalances, total };
    },
  });

  const total = data?.total ?? 0;
  const totalOwed = Math.round(total * 100) > 0;
  const totalSettled = Math.round(total * 100) === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <Pressable
          onPress={() => router.push('/group/new')}
          style={({ pressed }) => [styles.addButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="add" size={24} color={colors.textInverse} />
        </Pressable>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Overall, you</Text>
        <Text
          style={[
            styles.summaryAmount,
            { color: totalSettled ? colors.textMuted : totalOwed ? colors.positive : colors.danger },
          ]}
        >
          {totalSettled
            ? 'are all settled up'
            : `${totalOwed ? 'are owed' : 'owe'} ${formatAbsCurrency(total)}`}
        </Text>
      </View>

      <FlatList
        data={data?.groups ?? []}
        keyExtractor={(item) => item.group.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <GroupRow
            group={item.group}
            balance={item.balance}
            onPress={() => router.push(`/group/${item.group.id}`)}
          />
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="people-outline"
              title="No groups yet"
              subtitle="Create a group to start splitting expenses with friends."
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: { fontSize: fontSize.xxl, fontWeight: '900', color: colors.text },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  summaryLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  summaryAmount: { fontSize: fontSize.lg, fontWeight: '800' },
  list: { padding: spacing.lg, gap: spacing.md },
});
