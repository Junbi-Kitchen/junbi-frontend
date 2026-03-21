// Purpose: Custom tab bar layout for the 4 main app tabs with badge support

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import {
  Archive,
  ShoppingCart,
  BookOpen,
  User,
} from 'lucide-react-native';
import { TOKENS } from '../../lib/tokens';
import { useGroceryStore } from '../../stores/groceryStore';

const TABS = [
  { name: 'index', label: 'Pantry', icon: Archive },
  { name: 'recipes', label: 'Recipes', icon: BookOpen },
  { name: 'grocery', label: 'Grocery', icon: ShoppingCart },
  { name: 'profile', label: 'Profile', icon: User },
];

function CustomTabBar({
  state,
  navigation,
}: {
  state: { index: number; routes: { name: string; key: string }[] };
  descriptors: Record<string, { options: { tabBarBadge?: number } }>;
  navigation: {
    emit: (e: { type: string; target?: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}) {
  const groceryItems = useGroceryStore((s) => s.items);
  const uncheckedCount = groceryItems.filter((i) => !i.checked).length;

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: TOKENS.colors.white,
        borderTopWidth: 1,
        borderTopColor: TOKENS.colors.border,
        paddingBottom: 24,
        paddingTop: 10,
        paddingHorizontal: 8,
      }}
    >
      {state.routes.map((route, idx) => {
        const tab = TABS.find((t) => t.name === route.name) ?? TABS[idx];
        const Icon = tab?.icon ?? Archive;
        const isActive = state.index === idx;
        const activeColor = TOKENS.colors.primary;
        const inactiveColor = TOKENS.colors.textMuted;
        const color = isActive ? activeColor : inactiveColor;
        const showBadge = tab?.name === 'grocery' && uncheckedCount > 0;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            accessibilityLabel={tab?.label ?? route.name}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={{ flex: 1, alignItems: 'center', position: 'relative' }}
          >
            <View style={{ position: 'relative' }}>
              <Icon size={22} color={color} />
              {showBadge && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: TOKENS.colors.error,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: '700',
                      color: '#fff',
                    }}
                  >
                    {uncheckedCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: isActive ? '600' : '400',
                color,
                marginTop: 4,
              }}
            >
              {tab?.label ?? route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="recipes" />
      <Tabs.Screen name="grocery" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
