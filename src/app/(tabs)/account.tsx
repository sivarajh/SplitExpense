import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { notify } from '@/lib/dialogs';
import { getProfile, updateProfile } from '@/lib/api/profiles';
import { qk } from '@/lib/queryClient';
import { colors } from '@/theme/colors';
import { fontSize, radius, spacing } from '@/theme/spacing';

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const userId = user!.id;
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: qk.profile(userId),
    queryFn: () => getProfile(userId),
  });

  const [name, setName] = useState('');
  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
  }, [profile?.full_name]);

  const saveMutation = useMutation({
    mutationFn: () => updateProfile(userId, name.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.profile(userId) });
      notify('Saved', 'Your name has been updated.');
    },
    onError: (e: any) => notify('Error', e?.message ?? 'Could not save.'),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Account</Text>
      </View>

      <View style={styles.profileCard}>
        <Avatar name={profile?.full_name} email={profile?.email} size={72} />
        <Text style={styles.email}>{profile?.email ?? user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
        />
        <Button
          title="Save"
          onPress={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={!name.trim()}
        />
      </View>

      <View style={styles.footer}>
        <Button title="Sign Out" variant="danger" onPress={() => signOut()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  heading: { fontSize: fontSize.xxl, fontWeight: '900', color: colors.text },
  profileCard: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  email: { fontSize: fontSize.md, color: colors.textMuted },
  section: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
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
  footer: { marginTop: 'auto', padding: spacing.lg },
});
