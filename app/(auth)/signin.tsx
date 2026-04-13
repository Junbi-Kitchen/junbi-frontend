// Purpose: Sign in / sign up screen. Handles both Case 1 (post-quiz signup) and Case 3 (direct signup).

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useUserStore } from '../../stores/userStore';
import { auth } from '../../lib/firebase';
import { storage, STORAGE_KEYS } from '../../lib/storage';
import { TOKENS } from '../../lib/tokens';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'That email is already registered. Try signing in.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Incorrect email or password.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    default: return 'Something went wrong. Please try again.';
  }
}

export default function SignInScreen() {
  const router = useRouter();
  const { updatePreferences, pendingPreferences, setPendingPreferences, setHasSeenOnboarding } = useUserStore();

  const [mode, setMode] = useState<'signin' | 'signup'>(pendingPreferences ? 'signup' : 'signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        console.log('[SignIn] signin success — setting hasSeenOnboarding');
        setHasSeenOnboarding(true);
        await storage.set(STORAGE_KEYS.HAS_SEEN_ONBOARDING, true);
        console.log('[SignIn] hasSeenOnboarding set');
        // auth guard handles fetchProfile and navigation
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        console.log('[SignIn] signup success — setting hasSeenOnboarding');
        setHasSeenOnboarding(true);
        await storage.set(STORAGE_KEYS.HAS_SEEN_ONBOARDING, true);
        console.log('[SignIn] hasSeenOnboarding set');
        if (pendingPreferences) {
          // First install: quiz done before signup — flush prefs, auth guard navigates to tabs
          updatePreferences(pendingPreferences).catch(() => {});
          setPendingPreferences(null);
        } else {
          // Same-device new account: quiz after signup
          router.replace('/(auth)/quiz');
        }
      }
    } catch (e: any) {
      setFormError(mapFirebaseError(e.code));
    } finally {
      setLoading(false);
    }
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      {/* Back button */}
      {router.canGoBack() && (
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          style={{ padding: 16 }}
        >
          <ChevronLeft size={24} color={TOKENS.colors.text} />
        </TouchableOpacity>
      )}

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: router.canGoBack() ? 8 : 48 }}>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes['2xl'],
            fontWeight: TOKENS.typography.weights.bold,
            color: TOKENS.colors.text,
            marginBottom: 8,
          }}
        >
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </Text>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.md,
            color: TOKENS.colors.textSecondary,
            marginBottom: 32,
          }}
        >
          {mode === 'signin'
            ? 'Sign in to access your pantry and recipes.'
            : 'Save your pantry and recipes across devices.'}
        </Text>

        <View style={{ gap: 12, marginBottom: 24 }}>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange } }) => (
              <Input
                value={value ?? ''}
                onChangeText={onChange}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange } }) => (
              <Input
                value={value ?? ''}
                onChangeText={onChange}
                placeholder="Password"
                secureTextEntry={!showPassword}
                autoComplete={mode === 'signin' ? 'password' : 'new-password'}
                error={errors.password?.message}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword
                      ? <EyeOff size={20} color={TOKENS.colors.textSecondary} />
                      : <Eye size={20} color={TOKENS.colors.textSecondary} />
                    }
                  </TouchableOpacity>
                }
              />
            )}
          />
        </View>

        {formError && (
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.sm,
              color: TOKENS.colors.error,
              marginBottom: 16,
            }}
          >
            {formError}
          </Text>
        )}

        <Button
          label={mode === 'signin' ? 'Sign in' : 'Create account'}
          onPress={onSubmit}
          variant="primary"
          loading={loading}
          disabled={loading}
          fullWidth
        />

        <TouchableOpacity
          onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setFormError(null); }}
          accessibilityLabel={mode === 'signin' ? 'Switch to sign up' : 'Switch to sign in'}
          style={{ alignItems: 'center', paddingVertical: 16 }}
        >
          <Text style={{ fontSize: TOKENS.typography.sizes.md, color: TOKENS.colors.primary }}>
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
