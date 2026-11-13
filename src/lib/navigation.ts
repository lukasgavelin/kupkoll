import { Href, router } from 'expo-router';

/**
 * Navigates back if history exists, otherwise replaces with a safe fallback route.
 */
export function safeGoBack(fallback: Href = '/') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
