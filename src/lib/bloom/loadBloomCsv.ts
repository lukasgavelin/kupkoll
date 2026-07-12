export async function loadBloomCsvContent(): Promise<string> {
  throw new Error('CSV loading is disabled in production. Use precomputed bloomRegression.json.');
}

