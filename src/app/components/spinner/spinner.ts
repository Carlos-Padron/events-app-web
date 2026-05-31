import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="status" aria-label="Cargando">
      <div [class]="classes()"></div>
    </div>
  `,
})
export class Spinner {
  size = input<'sm' | 'md'>('sm');
  dark = input<boolean>(false);

  classes = computed(() => {
    const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8' };
    const border = this.dark() ? 'border-paper/20 border-t-ember' : 'border-bone border-t-ember';
    return `${sizes[this.size()]} border-2 ${border} rounded-full animate-spin`;
  });
}
