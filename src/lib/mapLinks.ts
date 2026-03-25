import { Coordinates } from '@/types/domain';

export function formatCoordinates(coordinates: Coordinates) {
  return `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`;
}

export function buildApiaryMapUrl(location: string, coordinates?: Coordinates) {
  if (coordinates) {
    const { latitude, longitude } = coordinates;
    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
  }

  const trimmedLocation = location.trim();

  if (!trimmedLocation) {
    return null;
  }

  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(trimmedLocation)}`;
}