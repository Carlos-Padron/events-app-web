import { EventStatus, PhotoFilter } from '../interfaces/event.interface';

/** Spanish display labels for an event's lifecycle status. */
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  scheduled: 'Programado',
  live: 'En vivo',
  closed: 'Cerrado',
  archived: 'Archivado',
  deleted: 'Eliminado',
};

/** Spanish display labels for the capture photo filter. */
export const PHOTO_FILTER_LABELS: Record<PhotoFilter, string> = {
  normal: 'Normal',
  vintage: 'Vintage',
  bw: 'B & N',
};
