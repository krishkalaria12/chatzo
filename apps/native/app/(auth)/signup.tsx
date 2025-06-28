import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { AppContainer } from '@/components/app-container';
import { SignUpForm } from '@/components/auth/signup-form';

export default function SignUpScreen() {
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
            <SignUpForm />

            {/* Sign In Link */}
            <View className='mt-8 flex-row justify-center items-center'>
              <Text className='text-base text-muted-foreground'>Already have an account? </Text>
              <Link href='/(auth)/signin' asChild>
                <Text className='text-primary font-semibold'>Sign In</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </AppContainer>
  );
}
