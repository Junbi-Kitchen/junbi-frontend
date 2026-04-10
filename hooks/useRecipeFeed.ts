// Purpose: Hook wrapping the recipe feed with swipe gesture logic using Reanimated 3

import { useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useRecipeStore } from '../stores/recipeStore';
import { recipesApi } from '../lib/api/recipes';
import type { Recipe } from '../types';

const SWIPE_THRESHOLD = 120;
const SPRING_CONFIG = { damping: 20, stiffness: 200 };

export function useRecipeFeed(tags?: string) {
  const { saveRecipe, skipRecipe } = useRecipeStore();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: ['recipe-feed', tags],
    queryFn: ({ pageParam }) =>
      recipesApi.getFeed({ cursor: pageParam as string | undefined, tags, limit: 10 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });

  const recipes: Recipe[] = data?.pages.flatMap((p) => p.recipes) ?? [];

  const rotation = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${interpolate(translateX.value, [-200, 0, 200], [-15, 0, 15])}deg` },
    ],
  }));

  const cardOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [1, 0.8]
    ),
  }));

  const doSave = useCallback(
    (recipe: Recipe) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      saveRecipe(recipe);
      if (recipes.length < 3 && hasNextPage && !isFetching) {
        fetchNextPage();
      }
    },
    [saveRecipe, recipes.length, hasNextPage, isFetching, fetchNextPage]
  );

  const doSkip = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      skipRecipe(id);
      if (recipes.length < 3 && hasNextPage && !isFetching) {
        fetchNextPage();
      }
    },
    [skipRecipe, recipes.length, hasNextPage, isFetching, fetchNextPage]
  );

  const handleSwipeRight = useCallback(
    (recipe: Recipe) => {
      translateX.value = withTiming(500, { duration: 300 }, () => {
        translateX.value = 0;
        translateY.value = 0;
        runOnJS(doSave)(recipe);
      });
    },
    [doSave, translateX, translateY]
  );

  const handleSwipeLeft = useCallback(
    (recipe: Recipe) => {
      translateX.value = withTiming(-500, { duration: 300 }, () => {
        translateX.value = 0;
        translateY.value = 0;
        runOnJS(doSkip)(recipe.id);
      });
    },
    [doSkip, translateX, translateY]
  );

  const createGesture = useCallback(
    (recipe: Recipe) =>
      Gesture.Pan()
        .onUpdate((e) => {
          translateX.value = e.translationX;
          translateY.value = e.translationY * 0.3;
        })
        .onEnd((e) => {
          if (e.translationX > SWIPE_THRESHOLD) {
            translateX.value = withTiming(500, { duration: 300 }, () => {
              translateX.value = 0;
              translateY.value = 0;
              runOnJS(doSave)(recipe);
            });
          } else if (e.translationX < -SWIPE_THRESHOLD) {
            translateX.value = withTiming(-500, { duration: 300 }, () => {
              translateX.value = 0;
              translateY.value = 0;
              runOnJS(doSkip)(recipe.id);
            });
          } else {
            translateX.value = withSpring(0, SPRING_CONFIG);
            translateY.value = withSpring(0, SPRING_CONFIG);
          }
        }),
    [doSave, doSkip, translateX, translateY]
  );

  return {
    recipes,
    isFetching,
    translateX,
    translateY,
    rotation,
    cardOpacity,
    handleSwipeLeft,
    handleSwipeRight,
    createGesture,
    fetchNextPage,
    hasNextPage,
  };
}
