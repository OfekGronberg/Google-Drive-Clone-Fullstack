import { Redirect } from 'expo-router';

// Index screen - default entry route
export default function Index() {
  return <Redirect href="/login" />;
}

