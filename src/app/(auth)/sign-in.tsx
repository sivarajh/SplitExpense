import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme/colors';
import { fontSize, radius, spacing } from '@/theme/spacing';

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setError(e?.message ?? 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <Text style={styles.logo}>SplitExpense</Text>
        <Text style={styles.subtitle}>Split bills with friends, settle up easily.</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Sign In" onPress={onSubmit} loading={loading} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New here? </Text>
          <Link href="/(auth)/sign-up" style={styles.link}>
            Create an account
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logo: {
    fontSize: fontSize.xxl,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  form: { gap: spacing.md },
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: { color: colors.textMuted, fontSize: fontSize.sm },
  link: { color: colors.primary, fontWeight: '700', fontSize: fontSize.sm },
});
