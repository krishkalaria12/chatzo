import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { DrawerContent } from '@/components/drawer/drawer-content';

// Wrapper function for the drawer content component
function CustomDrawerContent(props: DrawerContentComponentProps) {
  return <DrawerContent {...props} />;
}

export default function HomeLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={CustomDrawerContent}
        screenOptions={{
          headerShown: false,
          drawerHideStatusBarOnOpen: false,
          drawerStatusBarAnimation: 'fade',
          drawerStyle: {
            width: '70%', // Made narrower as requested
            borderTopRightRadius: 28,
            borderBottomRightRadius: 28,
            backgroundColor: 'transparent', // Let the DrawerContent handle colors
          },
        }}
      >
        {/* Main chat screen - removed chat label as requested */}
        <Drawer.Screen
          name='index'
          options={{
            drawerItemStyle: { display: 'none' }, // Hide from drawer navigation
          }}
        />

        {/* Hidden dynamic route */}
        <Drawer.Screen
          name='[id]'
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />

        {/* Settings screen */}
        <Drawer.Screen
          name='settings'
          options={{
            drawerItemStyle: { display: 'none' }, // Hide from drawer navigation
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
