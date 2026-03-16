// Purpose: Thin wrapper around @gorhom/bottom-sheet with backdrop for all modal sheets

import React, { useCallback, useRef } from 'react';
import { View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

interface BottomSheetWrapperProps {
  snapPoints: (string | number)[];
  children: React.ReactNode;
  onClose?: () => void;
  initialIndex?: number;
  sheetRef?: React.RefObject<BottomSheet>;
}

export function BottomSheetWrapper({
  snapPoints,
  children,
  onClose,
  initialIndex = 0,
  sheetRef,
}: BottomSheetWrapperProps) {
  const internalRef = useRef<BottomSheet>(null);
  const ref = sheetRef ?? internalRef;

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={ref}
      index={initialIndex}
      snapPoints={snapPoints}
      onClose={onClose}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: '#FFFFFF' }}
      handleIndicatorStyle={{ backgroundColor: '#E8E8E3', width: 40 }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        {children}
      </BottomSheetView>
    </BottomSheet>
  );
}
