import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import React, { useEffect } from 'react';

export const SignInForm = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');

  // If user is already signed in, redirect to home
  useEffect(() => {
    if (isSignedIn) {
      router.replace('/(home)');
    }
  }, [isSignedIn, router]);

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;

    // Check if user is already signed in
    if (isSignedIn) {
      router.replace('/(home)');
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(home)');
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error('Sign-in incomplete:', JSON.stringify(signInAttempt, null, 2));
        Alert.alert('Sign In Error', 'Please complete the sign-in process');
      }
    } catch (err: any) {
      console.error('Sign-in error:', JSON.stringify(err, null, 2));

      // Handle specific Clerk errors
      if (err.errors?.[0]?.code === 'session_exists') {
        // Session already exists, redirect to home
        router.replace('/(home)');
      } else if (err.errors?.[0]?.message) {
        Alert.alert('Sign In Error', err.errors[0].message);
      } else {
        Alert.alert('Sign In Error', 'Failed to sign in. Please try again.');
      }
    }
  };

  // Don't render if user is already signed in
  if (isSignedIn) {
    return null;
  }

  return (
    <View>
      <Text>Sign in</Text>
      <TextInput
        autoCapitalize='none'
        value={emailAddress}
        placeholder='Enter email'
        onChangeText={emailAddress => setEmailAddress(emailAddress)}
      />
      <TextInput
        value={password}
        placeholder='Enter password'
        secureTextEntry={true}
        onChangeText={password => setPassword(password)}
      />
      <TouchableOpacity onPress={onSignInPress}>
        <Text>Continue</Text>
      </TouchableOpacity>
      <View style={{ display: 'flex', flexDirection: 'row', gap: 3 }}>
        <Text>Don't have an account?</Text>
        <Link href='/signup'>
          <Text>Sign up</Text>
        </Link>
      </View>
    </View>
  );
};
