import * as FileSystem from 'expo-file-system/legacy';

/**
 * Deletes local image files stored inside the app's documentDirectory.
 * External or non-local URIs are ignored.
 */
export async function deleteLocalImageUris(uris: readonly string[] | undefined): Promise<void> {
  if (!uris || uris.length === 0) {
    return;
  }

  const docDir = FileSystem.documentDirectory;
  if (!docDir) {
    return;
  }

  const uniqueLocalUris = Array.from(new Set(uris)).filter((uri) => uri.startsWith(docDir));
  await Promise.all(
    uniqueLocalUris.map((uri) =>
      FileSystem.deleteAsync(uri, { idempotent: true }).catch((error) => {
        console.warn('[Kupkoll Media] Kunde inte radera lokal bild:', uri, error);
      }),
    ),
  );
}
