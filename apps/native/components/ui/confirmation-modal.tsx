import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useColorScheme } from '@/lib/use-color-scheme';
import { CHATZO_COLORS } from '@/lib/constants';
import { Button } from './button';
import { BlurView } from 'expo-blur';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const { isDarkColorScheme } = useColorScheme();
  const colors = isDarkColorScheme ? CHATZO_COLORS.dark : CHATZO_COLORS.light;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      // Entry animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleBackdropPress = () => {
    if (!loading) {
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='none'
      statusBarTranslucent
      onRequestClose={handleBackdropPress}
    >
      <View className='flex-1 justify-center items-center px-4'>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: fadeAnim,
            }}
          >
            {Platform.OS === 'ios' ? (
              <BlurView
                intensity={20}
                tint={isDarkColorScheme ? 'dark' : 'light'}
                style={{ flex: 1 }}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                }}
              />
            )}
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Modal Content */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: translateY }],
          }}
          className='w-full max-w-sm mx-4'
        >
          <View
            className='rounded-2xl p-6 shadow-2xl'
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: 1,
              shadowColor: colors.border,
              shadowOffset: {
                width: 0,
                height: 8,
              },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 24,
            }}
          >
            {/* Title */}
            <Text className='text-xl font-bold text-center mb-3' style={{ color: colors.text }}>
              {title}
            </Text>

            {/* Message */}
            <Text
              className='text-base text-center mb-8 leading-6'
              style={{ color: colors.textSecondary }}
            >
              {message}
            </Text>

            {/* Buttons */}
            <View className='flex-row space-x-3'>
              <Button
                title={cancelText}
                variant='outline'
                size='md'
                onPress={onCancel}
                disabled={loading}
                style={{ flex: 1 }}
              />
              <Button
                title={confirmText}
                variant={confirmVariant}
                size='md'
                onPress={onConfirm}
                loading={loading}
                disabled={loading}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
