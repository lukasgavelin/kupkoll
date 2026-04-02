import { beforeEach, describe, expect, it, vi } from 'vitest';

const { platform, alertMock } = vi.hoisted(() => ({
  platform: {
    OS: 'ios',
  },
  alertMock: vi.fn(),
}));

vi.mock('react-native', () => ({
  Alert: {
    alert: alertMock,
  },
  Platform: platform,
}));

import { confirmDestructiveAction } from '@/lib/confirm';

describe('confirmDestructiveAction', () => {
  beforeEach(() => {
    alertMock.mockReset();
    platform.OS = 'ios';
    vi.unstubAllGlobals();
  });

  it('uses native alert confirm button on non-web platforms', async () => {
    alertMock.mockImplementationOnce((_title, _message, buttons) => {
      const confirmButton = buttons?.[1];
      confirmButton?.onPress?.();
    });

    const confirmed = await confirmDestructiveAction({
      title: 'Ta bort kupa?',
      message: 'Detta tar bort kupan permanent.',
    });

    expect(confirmed).toBe(true);
    expect(alertMock).toHaveBeenCalledTimes(1);
  });

  it('resolves false when native alert is dismissed', async () => {
    alertMock.mockImplementationOnce((_title, _message, _buttons, options) => {
      options?.onDismiss?.();
    });

    const confirmed = await confirmDestructiveAction({
      title: 'Ta bort bigard?',
      message: 'Detta tar bort bigarden permanent.',
    });

    expect(confirmed).toBe(false);
  });

  it('uses browser confirm on web', async () => {
    platform.OS = 'web';
    const confirmMock = vi.fn(() => true);
    vi.stubGlobal('confirm', confirmMock);

    const confirmed = await confirmDestructiveAction({
      title: 'Ersatt data?',
      message: 'Import ersatter nuvarande data.',
      confirmLabel: 'Importera',
    });

    expect(confirmed).toBe(true);
    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(alertMock).not.toHaveBeenCalled();
  });

  it('returns false on web when confirm is unavailable', async () => {
    platform.OS = 'web';
    vi.stubGlobal('confirm', undefined);

    const confirmed = await confirmDestructiveAction({
      title: 'Ta bort?',
      message: 'Bekrafta borttagning.',
    });

    expect(confirmed).toBe(false);
    expect(alertMock).not.toHaveBeenCalled();
  });
});
