import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/lib/auth';
import { getActivity } from '@/lib/api/activity';
import { formatCurrency, formatRelativeDate } from '@/lib/format';
import { qk } from '@/lib/queryClient';
import type { ActivityItem } from '@/lib/types';
import { colors } from '@/theme/colors';
import { fontSize, radius, spacing } from '@/theme/spacing';

function nameOf(profile: { full_name: string | null; email: string } | undefined, fallback: string) {
  return profile?.full_name ?? profile?.email ?? fallback;
}

function ActivityRow({ item, userId }: { item: ActivityItem; userId: string }) {
  if (item.kind === 'expense') {
    const payer = item.expense.paid_by === userId ? 'You' : nameOf(item.expense.payer, 'Someone');
    return (
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name="receipt-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>
            {payer} added &quot;{item.expense.description}&quot;
          </Text>
          <Text style={styles.meta}>
            {item.groupName} · {formatCurrency(item.expense.amount)} ·{' '}
            {formatRelativeDate(item.date)}
          </Text>
        </View>
      </View>
    );
  }

  const from = item.settlement.from_user === userId ? 'You' : nameOf(item.settlement.from_profile, 'Someone');
  const to = item.settlement.to_user === userId ? 'you' : nameOf(item.settlement.to_profile, 'someone');
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: '#FDEEED' }]}>
        <Ionicons name="cash-outline" size={20} color={colors.danger} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>
          {from} paid {to} {formatCurrency(item.settlement.amount)}
        </Text>
        <Text style={styles.meta}>
          {item.groupName} · {formatRelativeDate(item.date)}
        </Text>
      </View>
    </View>
  );
}

export default function ActivityScreen() {
  const { user } = useAuth();
  const userId = user!.id;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: qk.activity,
    queryFn: () => getActivity(),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Activity</Text>
      </View>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.kind + item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => <ActivityRow item={item} userId={userId} />}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="pulse-outline"
              title="No activity yet"
              subtitle="Expenses and settlements will show up here."
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  heading: { fontSize: fontSize.xxl, fontWeight: '900', color: colors.text },
  list: { padding: spacing.lg, gap: spacing.sm },
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
  body: { flex: 1 },
  title: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
});
