import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

interface AvatarProps {
  name?: string | null;
  email?: string | null;
  size?: number;
}

function initials(name?: string | null, email?: string | null): string {
  const source = (name && name.trim()) || (email && email.trim()) || '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function colorFor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  const palette = colors.avatarPalette;
  return palette[Math.abs(hash) % palette.length];
}

export function Avatar({ name, email, size = 40 }: AvatarProps) {
  const bg = colorFor((name ?? '') + (email ?? ''));
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials(name, email)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.textInverse,
    fontWeight: '700',
  },
});
