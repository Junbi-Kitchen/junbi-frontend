import React, { useCallback, useRef } from 'react';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetProps,
} from '@gorhom/bottom-sheet';
import { useTheme } from '../../hooks/useTheme';

interface BottomSheetWrapperProps {
  snapPoints: (string | number)[];
  children: React.ReactNode;
  onClose?: () => void;
  initialIndex?: number;
  sheetRef?: React.RefObject<BottomSheet | null>;
  keyboardBehavior?: BottomSheetProps['keyboardBehavior'];
}

export function BottomSheetWrapper({
  snapPoints,
  children,
  onClose,
  initialIndex = 0,
  sheetRef,
  keyboardBehavior,
}: BottomSheetWrapperProps) {
  const { colors } = useTheme();
  const internalRef = useRef<BottomSheet>(null);
  const ref = sheetRef ?? internalRef;

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
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
      keyboardBehavior={keyboardBehavior}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        {children}
      </BottomSheetView>
    </BottomSheet>
  );
}
