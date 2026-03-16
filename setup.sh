#!/bin/bash
echo "Installing Gook (FridgeAI) dependencies..."

npx create-expo-app@latest . --template blank-typescript

npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

npx expo install react-native-reanimated react-native-gesture-handler

npx expo install expo-camera expo-image-picker expo-haptics expo-clipboard

npm install zustand @tanstack/react-query

npm install nativewind tailwindcss

npm install react-hook-form zod @hookform/resolvers

npm install @gorhom/bottom-sheet

npm install @shopify/flash-list

npm install lucide-react-native

npm install react-native-mmkv

npm install moti

npm install expo-linear-gradient

echo ""
echo "✅ Done. Next steps:"
echo "  1. Add nativewind config to tailwind.config.js and babel.config.js"
echo "  2. Run: npx expo start"
