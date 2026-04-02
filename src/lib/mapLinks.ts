import { Coordinates } from '@/types/domain';

export function formatCoordinates(coordinates: Coordinates) {
  return `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`;
}