// Cross-platform dialogs. React Native's `Alert` is a no-op on react-native-web,
// so on web we fall back to the browser's window.confirm / window.alert.
import { Alert, Platform } from 'react-native';

// Shows a destructive confirmation. Calls onConfirm only if the user accepts.
export function confirmDestructive(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void
) {
  if (Platform.OS === 'web') {
    const accepted =
      typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`);
    if (accepted) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

// Simple notification dialog.
export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    return;
  }
  Alert.alert(title, message);
}
