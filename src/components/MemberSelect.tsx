import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import type { Profile } from '@/lib/types';
import { colors } from '@/theme/colors';
import { fontSize, radius, spacing } from '@/theme/spacing';

// Single-select horizontal picker (used to choose who paid).
export function MemberSelect({
  members,
  selectedId,
  onSelect,
  currentUserId,
}: {
  members: Profile[];
  selectedId: string;
  onSelect: (id: string) => void;
  currentUserId: string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {members.map((m) => {
        const selected = m.id === selectedId;
        return (
          <Pressable
            key={m.id}
            onPress={() => onSelect(m.id)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Avatar name={m.full_name} email={m.email} size={28} />
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {m.id === currentUserId ? 'You' : m.full_name ?? m.email}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    maxWidth: 160,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E7F8F3',
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.text,
    flexShrink: 1,
  },
  labelSelected: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
