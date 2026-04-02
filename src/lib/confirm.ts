import { Alert, Platform } from 'react-native';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export function confirmDestructiveAction({
  title,
  message,
  confirmLabel = 'Ta bort',
  cancelLabel = 'Avbryt',
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof globalThis.confirm !== 'function') {
      return Promise.resolve(false);
    }

    return Promise.resolve(globalThis.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    let didResolve = false;
    const resolveOnce = (value: boolean) => {
      if (!didResolve) {
        didResolve = true;
        resolve(value);
      }
    };

    Alert.alert(
      title,
      message,
      [
        {
          text: cancelLabel,
          style: 'cancel',
          onPress: () => resolveOnce(false),
        },
        {
          text: confirmLabel,
          style: 'destructive',
          onPress: () => resolveOnce(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => resolveOnce(false),
      },
    );
  });
}