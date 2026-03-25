export type TabTutorialStorageValue = 'active' | 'done' | null;

export type TabTutorialViewState = {
  promptVisible: boolean;
  tutorialVisible: boolean;
};

export function deriveTabTutorialViewState(storedValue: string | null): TabTutorialViewState {
  if (storedValue === 'active') {
    return {
      promptVisible: false,
      tutorialVisible: true,
    };
  }

  if (storedValue === 'done') {
    return {
      promptVisible: false,
      tutorialVisible: false,
    };
  }

  return {
    promptVisible: true,
    tutorialVisible: false,
  };
}