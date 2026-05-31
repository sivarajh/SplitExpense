import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { createGroup } from '@/lib/api/groups';
import { qk } from '@/lib/queryClient';
import { colors } from '@/theme/colors';
import { fontSize, radius, spacing } from '@/theme/spacing';

export default function NewGroupScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createGroup(name, user!.id),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: qk.groups });
      router.replace(`/group/${group.id}`);
    },
    onError: (e: any) => setError(e?.message ?? 'Could not create group.'),
  });

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, title: 'New group', presentation: 'modal' }} />
      <View style={styles.container}>
        <Text style={styles.label}>Group name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Trip to Goa, Apartment 4B"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoFocus
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title="Create group"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!name.trim()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
