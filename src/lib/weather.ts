import { Coordinates, InspectionWeatherCondition, InspectionWeatherWind } from '@/types/domain';

type OpenMeteoCurrentWeatherResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
};

type SmhiForecastParameter = {
  name: string;
  values: number[];
};

type SmhiForecastTimeSeries = {
  validTime: string;
  parameters: SmhiForecastParameter[];
};

type SmhiPointForecastResponse = {
  timeSeries?: SmhiForecastTimeSeries[];
};

export type InspectionWeatherSnapshot = {
  condition: InspectionWeatherCondition;
  wind: InspectionWeatherWind;
  temperatureC: number;
  provider: 'SMHI' | 'Open-Meteo';
};

function buildRoundedCoordinate(value: number) {
  return value.toFixed(4);
}

export function buildSmhiPointForecastUrl(coordinates: Coordinates) {
  return `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${buildRoundedCoordinate(coordinates.longitude)}/lat/${buildRoundedCoordinate(coordinates.latitude)}/data.json`;
}

export function buildOpenMeteoWeatherUrl(coordinates: Coordinates) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');

  url.searchParams.set('latitude', coordinates.latitude.toString());
  url.searchParams.set('longitude', coordinates.longitude.toString());
  url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m');
  url.searchParams.set('wind_speed_unit', 'ms');

  return url.toString();
}

export function mapSmhiWeatherSymbol(symbol: number): InspectionWeatherCondition {
  if (symbol === 1 || symbol === 2) {
    return 'Soligt';
  }

  if (symbol === 3 || symbol === 4) {
    return 'Växlande molnighet';
  }

  if (symbol === 5 || symbol === 6 || symbol === 7) {
    return 'Mulet';
  }

  if ((symbol >= 8 && symbol <= 14) || symbol === 17 || symbol === 18) {
    return 'Duggregn';
  }

  return 'Regn';
}

export function mapOpenMeteoWeatherCode(code: number): InspectionWeatherCondition {
  if (code === 0) {
    return 'Soligt';
  }

  if (code === 1 || code === 2) {
    return 'Växlande molnighet';
  }

  if (code === 3 || code === 45 || code === 48) {
    return 'Mulet';
  }

  if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57 || code === 61 || code === 80) {
    return 'Duggregn';
  }

  return 'Regn';
}

export function mapWindSpeedToLabel(speedMetersPerSecond: number): InspectionWeatherWind {
  if (speedMetersPerSecond < 3.5) {
    return 'Lugnt';
  }

  if (speedMetersPerSecond < 8) {
    return 'Måttlig vind';
  }

  return 'Blåsigt';
}

function getSmhiParameterValue(parameters: SmhiForecastParameter[], name: string) {
  const parameter = parameters.find((item) => item.name === name);

  return parameter?.values[0];
}

function getClosestSmhiTimeSeries(timeSeries: SmhiForecastTimeSeries[], now = new Date()) {
  const futureEntry = timeSeries.find((entry) => new Date(entry.validTime).getTime() >= now.getTime());

  return futureEntry ?? timeSeries[0];
}

export function parseSmhiWeatherSnapshot(payload: SmhiPointForecastResponse, now = new Date()): InspectionWeatherSnapshot {
  const timeSeries = payload.timeSeries ?? [];

  if (!timeSeries.length) {
    throw new Error('SMHI weather response is missing time series.');
  }

  const entry = getClosestSmhiTimeSeries(timeSeries, now);
  const temperature = getSmhiParameterValue(entry.parameters, 't');
  const windSpeed = getSmhiParameterValue(entry.parameters, 'ws');
  const weatherSymbol = getSmhiParameterValue(entry.parameters, 'Wsymb2');

  if (temperature === undefined || windSpeed === undefined || weatherSymbol === undefined) {
    throw new Error('SMHI weather response is missing required values.');
  }

  return {
    condition: mapSmhiWeatherSymbol(weatherSymbol),
    wind: mapWindSpeedToLabel(windSpeed),
    temperatureC: Math.round(temperature * 10) / 10,
    provider: 'SMHI',
  };
}

export async function fetchSmhiWeather(coordinates: Coordinates, fetchImplementation: typeof fetch = fetch): Promise<InspectionWeatherSnapshot> {
  const response = await fetchImplementation(buildSmhiPointForecastUrl(coordinates));

  if (!response.ok) {
    throw new Error('SMHI weather request failed.');
  }

  return parseSmhiWeatherSnapshot((await response.json()) as SmhiPointForecastResponse);
}

export async function fetchOpenMeteoWeather(coordinates: Coordinates, fetchImplementation: typeof fetch = fetch): Promise<InspectionWeatherSnapshot> {
  const response = await fetchImplementation(buildOpenMeteoWeatherUrl(coordinates));

  if (!response.ok) {
    throw new Error('Weather request failed.');
  }

  const payload = (await response.json()) as OpenMeteoCurrentWeatherResponse;
  const current = payload.current;

  if (
    current?.temperature_2m === undefined ||
    current.weather_code === undefined ||
    current.wind_speed_10m === undefined
  ) {
    throw new Error('Weather response is missing required values.');
  }

  return {
    condition: mapOpenMeteoWeatherCode(current.weather_code),
    wind: mapWindSpeedToLabel(current.wind_speed_10m),
    temperatureC: Math.round(current.temperature_2m * 10) / 10,
    provider: 'Open-Meteo',
  };
}

export async function fetchInspectionWeather(coordinates: Coordinates, fetchImplementation: typeof fetch = fetch): Promise<InspectionWeatherSnapshot> {
  try {
    return await fetchSmhiWeather(coordinates, fetchImplementation);
  } catch {
    return fetchOpenMeteoWeather(coordinates, fetchImplementation);
  }
}

export async function fetchSeasonWeatherSignal(coordinates: Coordinates, fetchImplementation: typeof fetch = fetch) {
  return fetchInspectionWeather(coordinates, fetchImplementation);
}