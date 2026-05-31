import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { addMemberByEmail, listMembers } from '@/lib/api/members';
import { qk } from '@/lib/queryClient';
import { colors } from '@/theme/colors';
import { fontSize, radius, spacing } from '@/theme/spacing';

export default function MembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const { data: members } = useQuery({
    queryKey: qk.members(id),
    queryFn: () => listMembers(id),
  });

  const mutation = useMutation({
    mutationFn: () => addMemberByEmail(id, email),
    onSuccess: (res) => {
      if (res.ok) {
        setEmail('');
        setMessage({ text: 'Member added.', error: false });
        queryClient.invalidateQueries({ queryKey: qk.members(id) });
        queryClient.invalidateQueries({ queryKey: qk.groupData(id) });
        queryClient.invalidateQueries({ queryKey: [...qk.groups, 'balances'] });
      } else {
        setMessage({ text: res.message ?? 'Could not add member.', error: true });
      }
    },
    onError: (e: any) => setMessage({ text: e?.message ?? 'Could not add member.', error: true }),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: 'Members' }} />
      <View style={styles.addSection}>
        <Text style={styles.label}>Add by email</Text>
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="friend@email.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <Button
          title="Add member"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!email.trim()}
        />
        {message ? (
          <Text style={[styles.message, { color: message.error ? colors.danger : colors.primaryDark }]}>
            {message.text}
          </Text>
        ) : null}
      </View>

      <FlatList
        data={members ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            <Avatar name={item.profile?.full_name} email={item.profile?.email} size={40} />
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {item.profile?.full_name ?? item.profile?.email ?? 'Unknown'}
                {item.user_id === user?.id ? ' (You)' : ''}
              </Text>
              <Text style={styles.memberEmail}>{item.profile?.email}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  addSection: { padding: spacing.lg, gap: spacing.sm },
  label: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
  },
  message: { fontSize: fontSize.sm },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  memberEmail: { fontSize: fontSize.xs, color: colors.textMuted },
});
