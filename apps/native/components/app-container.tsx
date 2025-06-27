import React from 'react';
import { View, useWindowDimensions, Platform, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { CurvedScrollBar } from './curved-scrollbar';
import { useThemeColors } from './theme-colors';

interface ScrollBarConfig {
  enabled?: boolean;
  color?: string;
  width?: number;
  showRail?: boolean;
  cornerRadius?: number;
  edgePadding?: number;
  horizontalPosition?: number;
  visibleLength?: number;
  animation?: {
    damping?: number;
    stiffness?: number;
  };
  inactiveOpacity?: number;
}

interface AppContainerProps extends ViewProps {
  children: React.ReactNode;
  disableSafeArea?: boolean;
  disableStatusBar?: boolean;
  statusBarStyle?: 'auto' | 'inverted' | 'light' | 'dark';
  className?: string;
  scrollBar?: ScrollBarConfig;
  enableScrollBar?: boolean; // Simple boolean for basic usage
}

export function AppContainer({
  children,
  disableSafeArea = false,
  disableStatusBar = false,
  statusBarStyle = 'auto',
  className = '',
  scrollBar,
  enableScrollBar = false,
  ...props
}: AppContainerProps) {
  const colorScheme = useColorScheme();
  const themeColors = useThemeColors();
  const { height } = useWindowDimensions();

  // Determine the actual status bar style
  const actualStatusBarStyle =
    statusBarStyle === 'auto'
      ? colorScheme === 'dark'
        ? 'light'
        : 'dark'
      : statusBarStyle === 'inverted'
        ? colorScheme === 'dark'
          ? 'dark'
          : 'light'
        : statusBarStyle;

  // Base container styles
  const containerClassName = `flex-1 bg-background ${className}`;

  // Platform-specific styles
  const platformStyles = Platform.select({
    ios: {
      minHeight: height,
    },
    android: {
      minHeight: height,
    },
    web: {
      minHeight: height,
    },
  });

  // Determine if scrollbar should be enabled
  const shouldEnableScrollBar = enableScrollBar || scrollBar?.enabled;

  // Configure scrollbar with smart defaults
  const scrollBarConfig: ScrollBarConfig = {
    enabled: shouldEnableScrollBar,
    color: scrollBar?.color || (colorScheme === 'dark' ? '#f97316' : '#ea580c'), // Orange theme
    width: scrollBar?.width || 4,
    showRail: scrollBar?.showRail ?? true,
    cornerRadius: scrollBar?.cornerRadius || 12,
    edgePadding: scrollBar?.edgePadding || 10,
    horizontalPosition: scrollBar?.horizontalPosition || 1.1,
    visibleLength: scrollBar?.visibleLength || 70,
    animation: {
      damping: scrollBar?.animation?.damping || 30,
      stiffness: scrollBar?.animation?.stiffness || 500,
    },
    inactiveOpacity: scrollBar?.inactiveOpacity || 0.3,
    ...scrollBar,
  };

  const Container = disableSafeArea ? View : SafeAreaView;

  // If scrollbar is disabled, render the basic container
  if (!shouldEnableScrollBar) {
    return (
      <Container className={containerClassName} style={platformStyles} {...props}>
        {!disableStatusBar && <StatusBar style={actualStatusBarStyle} />}
        {children}
      </Container>
    );
  }

  // Render with curved scrollbar
  return (
    <Container className={containerClassName} style={platformStyles} {...props}>
      {!disableStatusBar && <StatusBar style={actualStatusBarStyle} />}
      <CurvedScrollBar
        backgroundColor={themeColors.bg}
        scrollBarColor={scrollBarConfig.color!}
        scrollBarWidth={scrollBarConfig.width!}
        showRail={scrollBarConfig.showRail!}
      >
        {children}
      </CurvedScrollBar>
    </Container>
  );
}

// Export types for external use
export type { AppContainerProps, ScrollBarConfig };
