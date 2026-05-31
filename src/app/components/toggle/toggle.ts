import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Toggle), multi: true },
  ],
  template: `
    <label class="flex items-center justify-between cursor-pointer gap-3">
      @if (label()) {
        <span class="text-sm">{{ label() }}</span>
      }
      <div class="relative flex-shrink-0">
        <input
          type="checkbox"
          class="sr-only peer"
          [checked]="checked()"
          [disabled]="isDisabled()"
          (change)="handleChange($event)"
          (blur)="onTouched()"
        />
        <div class="w-9 h-5 bg-bone rounded-full peer-checked:bg-ember transition-colors"></div>
        <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-paper rounded-full shadow peer-checked:translate-x-4 transition-transform pointer-events-none"></div>
      </div>
    </label>
  `,
})
export class Toggle implements ControlValueAccessor {
  label = input<string>('');

  checked    = signal<boolean>(false);
  isDisabled = signal<boolean>(false);

  private onChangeFn: (value: boolean) => void = () => {};
  onTouched: () => void = () => {};

  handleChange(event: Event): void {
    const val = (event.target as HTMLInputElement).checked;
    this.checked.set(val);
    this.onChangeFn(val);
  }

  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
