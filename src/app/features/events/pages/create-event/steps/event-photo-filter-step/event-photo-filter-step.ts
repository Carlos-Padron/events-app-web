import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { EventDraftService, PhotoFilter } from '../../event-draft.service';

interface FilterOption {
  id: PhotoFilter;
  label: string;
  cssFilter: string;
}

@Component({
  selector: 'app-event-photo-filter-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [NgOptimizedImage],
  templateUrl: './event-photo-filter-step.html',
})
export class EventPhotoFilterStep {
  readonly draft = inject(EventDraftService);

  readonly filters: FilterOption[] = [
    { id: 'normal',  label: 'Normal',  cssFilter: 'none' },
    { id: 'vintage', label: 'Vintage', cssFilter: 'sepia(0.42) contrast(0.84) brightness(1.08) saturate(1.2) hue-rotate(-10deg)' },
    { id: 'bw',      label: 'B & N',   cssFilter: 'grayscale(1) contrast(0.88) brightness(1.1) sepia(0.12)' },
  ];

  previewFilter = computed(() =>
    this.filters.find(f => f.id === this.draft.filter())?.cssFilter ?? 'none'
  );

  select(id: PhotoFilter): void {
    this.draft.filter.set(id);
  }

  optionClass(id: PhotoFilter): string {
    const base = 'flex flex-col items-center gap-2 rounded-2xl p-2 border-2 transition-colors cursor-pointer';
    return this.draft.filter() === id
      ? `${base} border-ember`
      : `${base} border-transparent`;
  }

  labelClass(id: PhotoFilter): string {
    return this.draft.filter() === id
      ? 'text-xs font-semibold text-ember'
      : 'text-xs font-medium text-earth';
  }
}
