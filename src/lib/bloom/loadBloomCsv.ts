import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

const BLOOM_CSV_MODULE = require('../../../assets/plants_calendar_2008-2024.csv');

export async function loadBloomCsvContent() {
  const asset = Asset.fromModule(BLOOM_CSV_MODULE);

  if (!asset.localUri) {
    await asset.downloadAsync();
  }

  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri);

    if (!response.ok) {
      throw new Error(`Could not load bloom CSV from ${asset.uri}.`);
    }

    return response.text();
  }

  const localUri = asset.localUri ?? asset.uri;

  if (!localUri) {
    throw new Error('Could not resolve local URI for bloom CSV asset.');
  }

  return new File(localUri).text();
}
