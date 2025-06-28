import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { AppContainer } from '@/components/app-container';
import { SignInForm } from '@/components/auth/signin-form';

export default function SignInScreen() {
  return (
    <AppContainer>
      <ScrollView className='flex-1 bg-background'>
        <View className='flex-1 bg-background'>
          {/* Header */}
          <View className='relative w-full h-[200px] bg-primary/10 items-center justify-center'>
            <Text className='text-3xl font-bold text-primary mb-2'>Chatzo</Text>
            <Text className='text-lg text-muted-foreground'>AI Chat Assistant</Text>
          </View>

          {/* Form Container */}
          <View className='p-6'>
            <SignInForm />

            {/* Sign Up Link */}
            <View className='mt-8 flex-row justify-center items-center'>
              <Text className='text-base text-muted-foreground'>Don't have an account? </Text>
              <Link href='/(auth)/signup' asChild>
                <Text className='text-primary font-semibold'>Sign Up</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </AppContainer>
  );
}
