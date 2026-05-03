// Purpose: Bottom sheet for managing and selecting delivery/pickup addresses

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {
  MapPin,
  Check,
  Plus,
  Home,
  Briefcase,
  Navigation,
} from 'lucide-react-native';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import { useUserStore } from '../../stores/userStore';
import type { UserAddress } from '../../types';

const LABEL_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Home,
  Work: Briefcase,
};

interface AddressPickerSheetProps {
  onConfirm: () => void;
}

export function AddressPickerSheet({ onConfirm }: AddressPickerSheetProps) {
  const { colors } = useTheme();
  const { user, setDefaultAddress, addAddress } = useUserStore();
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newZip, setNewZip] = useState('');

  const addresses = user?.addresses ?? [];
  const defaultId = user?.defaultAddressId;

  const handleAdd = () => {
    if (!newStreet.trim() || !newCity.trim()) return;
    const addr: UserAddress = {
      id: `addr-${Date.now()}`,
      label: newLabel || 'Other',
      street: newStreet,
      city: newCity,
      state: newState,
      zip: newZip,
      isDefault: addresses.length === 0,
    };
    addAddress(addr);
    setAdding(false);
    setNewLabel('');
    setNewStreet('');
    setNewCity('');
    setNewState('');
    setNewZip('');
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 4 }}>
        <Navigation size={18} color={colors.primary} />
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.xl,
            fontWeight: TOKENS.typography.weights.bold,
            color: colors.text,
          }}
        >
          Your Location
        </Text>
      </View>
      <Text
        style={{
          fontSize: TOKENS.typography.sizes.sm,
          color: colors.textSecondary,
          marginBottom: 20,
        }}
      >
        Stores and distances are based on your selected address
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
        {addresses.map((addr) => {
          const isSelected = addr.id === defaultId;
          const LabelIcon = LABEL_ICONS[addr.label] ?? MapPin;
          return (
            <TouchableOpacity
              key={addr.id}
              onPress={() => setDefaultAddress(addr.id)}
              accessibilityLabel={`Select ${addr.label} address`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderRadius: 16,
                marginBottom: 10,
                backgroundColor: isSelected
                  ? colors.primaryMuted
                  : colors.inputBg,
                borderWidth: isSelected ? 2 : 0,
                borderColor: colors.primary,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: isSelected ? colors.primary : colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <LabelIcon
                  size={18}
                  color={isSelected ? '#fff' : colors.textSecondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text
                    style={{
                      fontSize: TOKENS.typography.sizes.md,
                      fontWeight: TOKENS.typography.weights.semibold,
                      color: colors.text,
                    }}
                  >
                    {addr.label}
                  </Text>
                  {isSelected && (
                    <Badge label="Default" variant="success" size="sm" />
                  )}
                </View>
                <Text
                  style={{
                    fontSize: TOKENS.typography.sizes.sm,
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {addr.street}, {addr.city}, {addr.state} {addr.zip}
                </Text>
              </View>
              {isSelected && <Check size={18} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {adding ? (
        <View style={{ marginTop: 12, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {['Home', 'Work', 'Other'].map((label) => (
              <TouchableOpacity
                key={label}
                onPress={() => setNewLabel(label)}
                accessibilityLabel={`Label as ${label}`}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor:
                    newLabel === label ? colors.primaryMuted : colors.inputBg,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: newLabel === label ? '600' : '400',
                    color:
                      newLabel === label ? colors.primary : colors.textSecondary,
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input placeholder="Street address" value={newStreet} onChangeText={setNewStreet} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 2 }}>
              <Input placeholder="City" value={newCity} onChangeText={setNewCity} />
            </View>
            <View style={{ flex: 1 }}>
              <Input placeholder="State" value={newState} onChangeText={setNewState} />
            </View>
            <View style={{ flex: 1 }}>
              <Input placeholder="ZIP" value={newZip} onChangeText={setNewZip} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button label="Cancel" variant="ghost" onPress={() => setAdding(false)} />
            </View>
            <View style={{ flex: 2 }}>
              <Button
                label="Save Address"
                variant="primary"
                onPress={handleAdd}
                disabled={!newStreet.trim() || !newCity.trim()}
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={{ gap: 10, marginTop: 12, marginBottom: 16 }}>
          <Button
            label="Add New Address"
            variant="ghost"
            onPress={() => setAdding(true)}
            leftIcon={<Plus size={16} color={colors.text} />}
            fullWidth
          />
          <Button label="Confirm" variant="primary" onPress={onConfirm} fullWidth />
        </View>
      )}
    </View>
  );
}
