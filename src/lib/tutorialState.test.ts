import { describe, expect, it } from 'vitest';

import { deriveTabTutorialViewState } from '@/lib/tutorialState';

describe('deriveTabTutorialViewState', () => {
  it('shows the first-run prompt when no value has been stored', () => {
    expect(deriveTabTutorialViewState(null)).toEqual({
      promptVisible: true,
      tutorialVisible: false,
    });
  });

  it('shows the tab tutorial when the flow was started earlier', () => {
    expect(deriveTabTutorialViewState('active')).toEqual({
      promptVisible: false,
      tutorialVisible: true,
    });
  });

  it('hides both prompt and tutorial after completion', () => {
    expect(deriveTabTutorialViewState('done')).toEqual({
      promptVisible: false,
      tutorialVisible: false,
    });
  });
});