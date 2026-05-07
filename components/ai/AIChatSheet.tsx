// Purpose: Global AI chat bottom sheet — accessible from any screen via FAB

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Camera, Mic, ChefHat } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import { useRecipeStore } from '../../stores/recipeStore';
import { useSavingsStore } from '../../stores/savingsStore';
import { useGroceryStore } from '../../stores/groceryStore';

// ─── Types ──────────────────────────────────────────────────

type RichContent =
  | { type: 'recipe'; id: string; title: string; imageUri: string; cookTime: number }
  | { type: 'grocery'; items: { name: string; checked: boolean }[] }
  | { type: 'savings'; amount: number; meals: number };

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  richContent?: RichContent;
  timestamp: Date;
}

const QUICK_REPLIES = [
  'What should I cook?',
  'Plan my week',
  'Scan receipt',
  'Show my savings',
];

// ─── Component ──────────────────────────────────────────────

interface AIChatSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  onSheetChange?: (index: number) => void;
}

export function AIChatSheet({ sheetRef, onSheetChange }: AIChatSheetProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: "Hey! I'm your kitchen assistant. Ask me what to cook, plan your week, or just tell me what's going on.",
      timestamp: new Date(),
    },
  ]);
  const scrollRef = useRef<ScrollView>(null);

  const recipes = useRecipeStore((s) => s.saved);
  const savings = useSavingsStore();
  const groceryItems = useGroceryStore((s) => s.items);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={0}
        appearsOnIndex={1}
        opacity={0.3}
      />
    ),
    []
  );

  const getMockResponse = (userText: string): ChatMessage => {
    const lower = userText.toLowerCase();

    if (lower.includes('cook') || lower.includes('dinner') || lower.includes('recipe')) {
      const recipe = recipes[0];
      if (recipe) {
        return {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: `How about ${recipe.title}? It takes about ${recipe.cookTimeMinutes} minutes and uses stuff you probably have.`,
          richContent: {
            type: 'recipe',
            id: recipe.id,
            title: recipe.title,
            imageUri: recipe.imageUri,
            cookTime: recipe.cookTimeMinutes,
          },
          timestamp: new Date(),
        };
      }
    }

    if (lower.includes('plan') || lower.includes('week')) {
      return {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: "I'll plan your week! Give me a sec... I'll prioritize ingredients expiring soon and keep it under budget.",
        timestamp: new Date(),
      };
    }

    if (lower.includes('grocery') || lower.includes('order') || lower.includes('list')) {
      const unchecked = groceryItems.filter((i) => !i.checked).slice(0, 4);
      return {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: `You've got ${unchecked.length} items on your list. Here's a preview:`,
        richContent: {
          type: 'grocery',
          items: unchecked.map((i) => ({ name: i.name, checked: i.checked })),
        },
        timestamp: new Date(),
      };
    }

    if (lower.includes('saving') || lower.includes('saved') || lower.includes('money')) {
      const usedCount = savings.wasteLog.filter((e) => e.action === 'used').length;
      return {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: "You're doing great! Here's your savings this month:",
        richContent: {
          type: 'savings',
          amount: savings.totalSavedThisMonth,
          meals: usedCount,
        },
        timestamp: new Date(),
      };
    }

    if (lower.includes('scan') || lower.includes('receipt')) {
      return {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: 'Sure! Open the camera and scan your receipt — I\'ll add everything to your pantry automatically.',
        timestamp: new Date(),
      };
    }

    if (lower.includes('vegetarian') || lower.includes('vegan') || lower.includes('diet')) {
      return {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: "Got it! I've updated your dietary preferences. I'll keep that in mind for all future suggestions.",
        timestamp: new Date(),
      };
    }

    return {
      id: `ai-${Date.now()}`,
      role: 'ai',
      text: "I can help with meal planning, recipes, or groceries. Try asking \"what should I cook tonight?\" or \"plan my week for $60\".",
      timestamp: new Date(),
    };
  };

  const handleSend = async (text?: string) => {
    const messageText = text ?? input.trim();
    if (!messageText) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    // Simulate AI typing delay
    setTimeout(() => {
      setIsTyping(false);
      const aiMsg = getMockResponse(messageText);
      setMessages((prev) => [...prev, aiMsg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1200);
  };

  const handleSheetChange = (index: number) => {
    onSheetChange?.(index);
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['10%', '55%', '92%']}
      onChange={handleSheetChange}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={10}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 20,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderLight,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: colors.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChefHat size={16} color={colors.primary} />
            </View>
            <View>
              <Text
                style={{
                  fontSize: TOKENS.typography.sizes.md,
                  fontWeight: TOKENS.typography.weights.semibold,
                  color: colors.text,
                }}
              >
                Kitchen AI
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                Always here to help
              </Text>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onRecipeTap={(id) => {
                  sheetRef.current?.close();
                  router.push(`/recipe/${id}`);
                }}
              />
            ))}
            {isTyping && <TypingIndicator />}
          </ScrollView>

          {/* Quick replies */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}
          >
            {QUICK_REPLIES.map((reply) => (
              <TouchableOpacity
                key={reply}
                onPress={() => handleSend(reply)}
                accessibilityLabel={reply}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: colors.inputBg,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: colors.text,
                  }}
                >
                  {reply}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 16,
              paddingVertical: 12,
              paddingBottom: Platform.OS === 'ios' ? 28 : 12,
              borderTopWidth: 1,
              borderTopColor: colors.borderLight,
              backgroundColor: colors.surface,
            }}
          >
            <TouchableOpacity accessibilityLabel="Open camera" style={{ padding: 4 }}>
              <Camera size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <View
              style={{
                flex: 1,
                backgroundColor: colors.inputBg,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask me anything..."
                placeholderTextColor={colors.textMuted}
                returnKeyType="send"
                onSubmitEditing={() => handleSend()}
                style={{
                  fontSize: 15,
                  color: colors.text,
                  maxHeight: 80,
                }}
                multiline
              />
            </View>

            <TouchableOpacity accessibilityLabel="Voice input" style={{ padding: 4 }}>
              <Mic size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheet>
  );
}

// ─── Message bubble ─────────────────────────────────────────

function MessageBubble({
  message,
  onRecipeTap,
}: {
  message: ChatMessage;
  onRecipeTap: (id: string) => void;
}) {
  const { colors } = useTheme();
  const isUser = message.role === 'user';

  return (
    <View
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
      }}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 18,
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius: isUser ? 18 : 4,
          backgroundColor: isUser ? colors.primary : colors.inputBg,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            lineHeight: 21,
            color: isUser ? '#fff' : colors.text,
          }}
        >
          {message.text}
        </Text>
      </View>

      {/* Rich content */}
      {message.richContent && (
        <View style={{ marginTop: 8 }}>
          {message.richContent.type === 'recipe' && (
            <TouchableOpacity
              onPress={() => onRecipeTap(message.richContent!.type === 'recipe' ? (message.richContent as { id: string }).id : '')}
              accessibilityLabel={`Open ${(message.richContent as { title: string }).title}`}
              style={{
                flexDirection: 'row',
                backgroundColor: colors.surface,
                borderRadius: 14,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <Image
                source={{ uri: (message.richContent as { imageUri: string }).imageUri }}
                style={{ width: 64, height: 64 }}
              />
              <View style={{ flex: 1, padding: 10, justifyContent: 'center' }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.text,
                  }}
                >
                  {(message.richContent as { title: string }).title}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  {(message.richContent as { cookTime: number }).cookTime} min
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {message.richContent.type === 'grocery' && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.borderLight,
                gap: 6,
              }}
            >
              {(message.richContent as { items: { name: string; checked: boolean }[] }).items.map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      borderWidth: 1.5,
                      borderColor: colors.border,
                    }}
                  />
                  <Text style={{ fontSize: 14, color: colors.text }}>{item.name}</Text>
                </View>
              ))}
            </View>
          )}

          {message.richContent.type === 'savings' && (
            <View
              style={{
                backgroundColor: `${colors.accent}12`,
                borderRadius: 14,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 32, fontWeight: '700', color: colors.accent }}>
                ${(message.richContent as { amount: number }).amount.toFixed(2)}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                saved this month · {(message.richContent as { meals: number }).meals} meals cooked
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Typing indicator (3 sequential pulsing dots) ───────────

function TypingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.textMuted,
        },
        style,
      ]}
    />
  );
}

function TypingIndicator() {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        gap: 4,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        backgroundColor: colors.inputBg,
      }}
    >
      <TypingDot delay={0} />
      <TypingDot delay={150} />
      <TypingDot delay={300} />
    </View>
  );
}
