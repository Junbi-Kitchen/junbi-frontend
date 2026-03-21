/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)/onboarding` | `/(tabs)` | `/(tabs)/` | `/(tabs)/grocery` | `/(tabs)/profile` | `/(tabs)/recipes` | `/_sitemap` | `/connected-accounts` | `/grocery` | `/import` | `/onboarding` | `/profile` | `/recipes`;
      DynamicRoutes: `/recipe/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/recipe/[id]`;
    }
  }
}
