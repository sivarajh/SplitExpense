import { Stack } from 'expo-router';

// Land on sign-in by default when entering the auth group.
export const unstable_settings = {
  initialRouteName: 'sign-in',
};

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
