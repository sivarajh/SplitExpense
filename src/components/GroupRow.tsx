import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BalancePill } from '@/components/BalancePill';
import type { Group } from '@/lib/types';
import { colors } from '@/theme/colors';
import { fontSize, radius, spacing } from '@/theme/spacing';

export function GroupRow({
  group,
  balance,
  onPress,
}: {
  group: Group;
  balance: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.icon}>
        <Ionicons name="people" size={22} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{group.name}</Text>
        <BalancePill amount={balance} />
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#E7F8F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
});
