import React, { useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { Home, ChefHat, ShoppingCart, User, Plus } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useGroceryStore } from '../../stores/groceryStore';
import { BottomSheetWrapper } from '../../components/ui/BottomSheetWrapper';
import { GlobalAddSheet, type AddAction } from '../../components/ui/GlobalAddSheet';
import { ManualAddSheet } from '../../components/pantry/ManualAddSheet';
import { ReceiptScanModal } from '../../components/pantry/ReceiptScanModal';

interface TabRoute { name: string; key: string }
interface TabState { index: number; routes: TabRoute[] }
interface TabNav {
  emit: (e: { type: string; target?: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean };
  navigate: (name: string) => void;
}

const LEFT_TABS = [
  { name: 'index', label: 'Home', icon: Home },
  { name: 'kitchen', label: 'Kitchen', icon: ChefHat },
];
const RIGHT_TABS = [
  { name: 'grocery', label: 'Grocery', icon: ShoppingCart },
  { name: 'profile', label: 'Profile', icon: User },
];
const ALL_TABS = [...LEFT_TABS, ...RIGHT_TABS];

function CustomTabBar({ state, navigation, onAddPress }: {
  state: TabState; navigation: TabNav; descriptors: unknown; onAddPress: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const groceryItems = useGroceryStore((s) => s.items);
  const uncheckedCount = groceryItems.filter((i) => !i.checked).length;

  const renderTab = (tabDef: typeof LEFT_TABS[0]) => {
    const route = state.routes.find((r) => r.name === tabDef.name);
    if (!route) return null;
    const Icon = tabDef.icon;
    const routeIndex = state.routes.findIndex((r) => r.name === tabDef.name);
    const isActive = state.index === routeIndex;
    const color = isActive ? colors.primary : colors.tabInactive;
    const showBadge = tabDef.name === 'grocery' && uncheckedCount > 0;

    return (
      <TouchableOpacity
        key={route.key}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isActive && !event.defaultPrevented) navigation.navigate(tabDef.name);
        }}
        accessibilityLabel={tabDef.label}
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
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>{uncheckedCount}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 10, fontWeight: isActive ? '600' : '400', color, marginTop: 4 }}>
          {tabDef.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: Math.max(insets.bottom, 8),
      paddingTop: 10,
      paddingHorizontal: 8,
    }}>
      {LEFT_TABS.map(renderTab)}

      {/* Center add button */}
      <TouchableOpacity
        onPress={onAddPress}
        accessibilityLabel="Add item or recipe"
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 4 }}
      >
        <View style={{
          width: 50, height: 50, borderRadius: 25,
          backgroundColor: colors.primary,
          alignItems: 'center', justifyContent: 'center',
          marginTop: -18,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22, shadowRadius: 8, elevation: 6,
        }}>
          <Plus size={24} color="#fff" />
        </View>
      </TouchableOpacity>

      {RIGHT_TABS.map(renderTab)}
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const globalAddRef = useRef<BottomSheet>(null);
  const manualAddRef = useRef<BottomSheet>(null);
  const [receiptVisible, setReceiptVisible] = useState(false);

  const handleAddAction = useCallback((action: AddAction) => {
    globalAddRef.current?.close();
    setTimeout(() => {
      if (action === 'receipt' || action === 'fridge') {
        setReceiptVisible(true);
      } else if (action === 'ingredient') {
        manualAddRef.current?.expand();
      } else if (action === 'import') {
        router.push('/import');
      }
    }, 350);
  }, [router]);

  return (
    <BottomSheetModalProvider>
      <Tabs
        tabBar={(props) => (
          <CustomTabBar
            {...(props as unknown as { state: TabState; navigation: TabNav; descriptors: unknown })}
            onAddPress={() => globalAddRef.current?.expand()}
          />
        )}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="kitchen" />
        <Tabs.Screen name="grocery" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="chat" options={{ href: null }} />
      </Tabs>

      {/* Global add options sheet */}
      <BottomSheetWrapper sheetRef={globalAddRef} snapPoints={['52%']} initialIndex={-1}>
        <GlobalAddSheet onSelect={handleAddAction} />
      </BottomSheetWrapper>

      {/* Global manual add sheet */}
      <BottomSheetWrapper sheetRef={manualAddRef} snapPoints={['80%']} initialIndex={-1} keyboardBehavior="interactive">
        <ManualAddSheet onClose={() => manualAddRef.current?.close()} />
      </BottomSheetWrapper>

      {/* Global receipt / fridge scan */}
      <ReceiptScanModal visible={receiptVisible} onClose={() => setReceiptVisible(false)} />
    </BottomSheetModalProvider>
  );
}
