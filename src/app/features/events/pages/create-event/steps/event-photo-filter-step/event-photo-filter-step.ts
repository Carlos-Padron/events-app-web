import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

type PhotoFilter = 'normal' | 'vintage' | 'bw';

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
  readonly filters: FilterOption[] = [
    { id: 'normal',  label: 'Normal',  cssFilter: 'none' },
    { id: 'vintage', label: 'Vintage', cssFilter: 'contrast(0.85) brightness(1.15) saturate(2.2) sepia(0.28) hue-rotate(-10deg)' },
    { id: 'bw',      label: 'B & N',   cssFilter: 'grayscale(1) contrast(0.88) brightness(1.1) sepia(0.12)' },
  ];

  selectedFilter = signal<PhotoFilter>('normal');

  previewFilter = computed(() =>
    this.filters.find(f => f.id === this.selectedFilter())?.cssFilter ?? 'none'
  );

  select(id: PhotoFilter): void {
    this.selectedFilter.set(id);
  }

  optionClass(id: PhotoFilter): string {
    const base = 'flex flex-col items-center gap-2 rounded-2xl p-2 border-2 transition-colors cursor-pointer';
    return this.selectedFilter() === id
      ? `${base} border-ember`
      : `${base} border-transparent`;
  }

  labelClass(id: PhotoFilter): string {
    return this.selectedFilter() === id
      ? 'text-xs font-semibold text-ember'
      : 'text-xs font-medium text-earth';
  }
}
