import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  ChefHat,
  Bot,
  ShoppingCart,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import { useGroceryStore } from '../../stores/groceryStore';

interface TabRoute { name: string; key: string }
interface TabState { index: number; routes: TabRoute[] }
interface TabNav {
  emit: (e: { type: string; target?: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean };
  navigate: (name: string) => void;
}

const TABS = [
  { name: 'index', label: 'Home', icon: Home },
  { name: 'kitchen', label: 'Kitchen', icon: ChefHat },
  { name: 'chat', label: 'Agent', icon: Bot },
  { name: 'grocery', label: 'Grocery', icon: ShoppingCart },
];

function CustomTabBar({ state, navigation }: { state: TabState; navigation: TabNav; descriptors: unknown }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const groceryItems = useGroceryStore((s) => s.items);
  const uncheckedCount = groceryItems.filter((i) => !i.checked).length;

  const visibleRoutes = state.routes.filter((r) =>
    TABS.some((t) => t.name === r.name)
  );

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: Math.max(insets.bottom, 8),
      paddingTop: 10,
      paddingHorizontal: 8,
    }}>
      {visibleRoutes.map((route) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const Icon = tab.icon;
        const routeIndex = state.routes.findIndex((r) => r.name === route.name);
        const isActive = state.index === routeIndex;
        const color = isActive ? colors.primary : colors.tabInactive;
        const showBadge = tab.name === 'grocery' && uncheckedCount > 0;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={{ flex: 1, alignItems: 'center', position: 'relative' }}
          >
            <View style={{ position: 'relative' }}>
              <Icon size={24} color={color} />
              {showBadge && (
                <View style={{
                  position: 'absolute', top: -4, right: -8,
                  minWidth: 16, height: 16, borderRadius: 8,
                  backgroundColor: colors.error,
                  alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
                }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>
                    {uncheckedCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{
              fontSize: 10,
              fontWeight: isActive ? '600' : '400',
              color,
              marginTop: 4,
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <BottomSheetModalProvider>
      <Tabs
        tabBar={(props) => <CustomTabBar {...(props as unknown as { state: TabState; navigation: TabNav; descriptors: unknown })} />}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="kitchen" />
        <Tabs.Screen name="chat" />
        <Tabs.Screen name="grocery" />
      </Tabs>
    </BottomSheetModalProvider>
  );
}
