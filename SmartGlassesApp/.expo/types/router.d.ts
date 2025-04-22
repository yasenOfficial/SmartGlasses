/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/saved` | `/(tabs)/settings` | `/_sitemap` | `/saved` | `/screens/GPT` | `/screens/Maps` | `/screens/StepTrac` | `/screens/To_do` | `/settings`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
