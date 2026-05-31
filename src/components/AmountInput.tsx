import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/theme/colors';
import { fontSize, radius, spacing } from '@/theme/spacing';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

// Numeric money input. Keeps the raw string (so users can type "12.") and only
// allows digits + a single decimal point with up to 2 decimal places.
export function AmountInput({ value, onChangeText, placeholder = '0.00', autoFocus }: AmountInputProps) {
  const handle = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    let next = parts[0];
    if (parts.length > 1) next += '.' + parts.slice(1).join('').slice(0, 2);
    onChangeText(next);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.symbol}>$</Text>
      <TextInput
        value={value}
        onChangeText={handle}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        autoFocus={autoFocus}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  symbol: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    paddingVertical: spacing.md,
  },
});
