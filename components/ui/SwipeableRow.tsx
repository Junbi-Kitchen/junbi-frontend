// Purpose: Swipeable row revealing delete/edit actions using Reanimated 3 + Gesture Handler

import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Trash2, Edit3 } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DELETE_THRESHOLD = -80;
const EDIT_THRESHOLD = 80;
const ACTION_WIDTH = 72;

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  deleteLabel?: string;
  editLabel?: string;
}

export function SwipeableRow({
  children,
  onDelete,
  onEdit,
  deleteLabel = 'Delete',
  editLabel = 'Edit',
}: SwipeableRowProps) {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const gesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      const hasDelete = !!onDelete;
      const hasEdit = !!onEdit;
      if (e.translationX < 0 && hasDelete) {
        translateX.value = Math.max(e.translationX, -ACTION_WIDTH * 1.2);
      } else if (e.translationX > 0 && hasEdit) {
        translateX.value = Math.min(e.translationX, ACTION_WIDTH * 1.2);
      }
    })
    .onEnd((e) => {
      if (e.translationX < DELETE_THRESHOLD && onDelete) {
        translateX.value = withSpring(-ACTION_WIDTH);
      } else if (e.translationX > EDIT_THRESHOLD && onEdit) {
        translateX.value = withSpring(ACTION_WIDTH);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const closeRow = () => {
    translateX.value = withSpring(0);
  };

  return (
    <View className="overflow-hidden">
      {/* Delete action (right side, visible on swipe left) */}
      {onDelete && (
        <View className="absolute right-0 top-0 bottom-0 w-[72px] bg-[#E63946] items-center justify-center">
          <TouchableOpacity
            onPress={() => {
              closeRow();
              onDelete();
            }}
            accessibilityLabel={deleteLabel}
            className="flex-1 w-full items-center justify-center"
          >
            <Trash2 size={20} color="#FFFFFF" />
            <Text className="text-white text-xs mt-1 font-medium">{deleteLabel}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Edit action (left side, visible on swipe right) */}
      {onEdit && (
        <View className="absolute left-0 top-0 bottom-0 w-[72px] bg-[#2D6A4F] items-center justify-center">
          <TouchableOpacity
            onPress={() => {
              closeRow();
              onEdit();
            }}
            accessibilityLabel={editLabel}
            className="flex-1 w-full items-center justify-center"
          >
            <Edit3 size={20} color="#FFFFFF" />
            <Text className="text-white text-xs mt-1 font-medium">{editLabel}</Text>
          </TouchableOpacity>
        </View>
      )}

      <GestureDetector gesture={gesture}>
        <Animated.View style={animatedStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
