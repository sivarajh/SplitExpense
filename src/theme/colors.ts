// Central color palette for the app. Single source of truth for styling.
export const colors = {
  primary: '#1CC29F', // teal/green — money positive accent
  primaryDark: '#15A085',
  danger: '#E1564F', // owed / negative
  positive: '#1CC29F', // you are owed
  warning: '#F0A202',

  text: '#1A1A2E',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',

  background: '#F7F8FA',
  card: '#FFFFFF',
  border: '#E5E7EB',

  // Deterministic avatar background palette.
  avatarPalette: [
    '#1CC29F',
    '#5B8DEF',
    '#F0A202',
    '#E1564F',
    '#9B5DE5',
    '#00BBF9',
    '#FF6B6B',
    '#3A86FF',
  ],
} as const;
