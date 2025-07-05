import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View, Alert, StyleSheet } from 'react-native';
import React, { useEffect } from 'react';
import { useColorScheme } from '@/lib/use-color-scheme';

export const SignInForm = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/(home)');
    }
  }, [isSignedIn, router]);

  const onSignInPress = async () => {
    if (!isLoaded) return;
    if (isSignedIn) {
      router.replace('/(home)');
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(home)');
      } else {
        console.error('Sign-in incomplete:', JSON.stringify(signInAttempt, null, 2));
        Alert.alert('Sign In Error', 'Please complete the sign-in process');
      }
    } catch (err: any) {
      console.error('Sign-in error:', JSON.stringify(err, null, 2));

      if (err.errors?.[0]?.code === 'session_exists') {
        router.replace('/(home)');
      } else if (err.errors?.[0]?.message) {
        Alert.alert('Sign In Error', err.errors[0].message);
      } else {
        Alert.alert('Sign In Error', 'Failed to sign in. Please try again.');
      }
    }
  };

  if (isSignedIn) {
    return null;
  }

  const styles = getStyles(isDarkColorScheme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <TextInput
        autoCapitalize='none'
        value={emailAddress}
        placeholder='Enter email'
        onChangeText={emailAddress => setEmailAddress(emailAddress)}
        style={styles.input}
        placeholderTextColor={isDarkColorScheme ? '#9CA3AF' : '#6B7280'}
      />
      <TextInput
        value={password}
        placeholder='Enter password'
        secureTextEntry={true}
        onChangeText={password => setPassword(password)}
        style={styles.input}
        placeholderTextColor={isDarkColorScheme ? '#9CA3AF' : '#6B7280'}
      />
      <TouchableOpacity onPress={onSignInPress} style={styles.button}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
      <View style={styles.linkContainer}>
        <Text style={styles.linkText}>Don't have an account? </Text>
        <Link href='/signup'>
          <Text style={styles.link}>Sign up</Text>
        </Link>
      </View>
    </View>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
      gap: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#111827',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#D1D5DB',
      borderRadius: 8,
      padding: 12,
      color: isDark ? '#FFFFFF' : '#111827',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    },
    button: {
      backgroundColor: '#2563EB',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    linkContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    linkText: {
      color: isDark ? '#9CA3AF' : '#4B5563',
    },
    link: {
      color: '#2563EB',
      fontWeight: '600',
    },
  });
