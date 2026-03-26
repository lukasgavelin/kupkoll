import { Coordinates, InspectionWeatherCondition, InspectionWeatherWind } from '@/types/domain';

type OpenMeteoCurrentWeatherResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
};

export type InspectionWeatherSnapshot = {
  condition: InspectionWeatherCondition;
  wind: InspectionWeatherWind;
  temperatureC: number;
};

export function buildOpenMeteoWeatherUrl(coordinates: Coordinates) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');

  url.searchParams.set('latitude', coordinates.latitude.toString());
  url.searchParams.set('longitude', coordinates.longitude.toString());
  url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m');
  url.searchParams.set('wind_speed_unit', 'ms');

  return url.toString();
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

export async function fetchInspectionWeather(coordinates: Coordinates, fetchImplementation: typeof fetch = fetch): Promise<InspectionWeatherSnapshot> {
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
  };
}