// Purpose: React context to share the AI chat sheet ref across the app

import React, { createContext, useContext, useRef } from 'react';
import type BottomSheet from '@gorhom/bottom-sheet';

interface AIChatContextValue {
  sheetRef: React.RefObject<BottomSheet>;
  openChat: () => void;
}

const AIChatContext = createContext<AIChatContextValue | null>(null);

export function AIChatProvider({ children }: { children: React.ReactNode }) {
  const sheetRef = useRef<BottomSheet>(null);

  const openChat = () => {
    sheetRef.current?.snapToIndex(1);
  };

  return (
    <AIChatContext.Provider value={{ sheetRef, openChat }}>
      {children}
    </AIChatContext.Provider>
  );
}

export function useAIChat() {
  const ctx = useContext(AIChatContext);
  if (!ctx) throw new Error('useAIChat must be used within AIChatProvider');
  return ctx;
}
