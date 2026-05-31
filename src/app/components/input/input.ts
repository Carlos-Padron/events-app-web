import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Input), multi: true },
  ],
  template: `
    <label class="block">
      @if (label()) {
        <span [class]="labelClasses()">{{ label() }}</span>
      }
      <input
        [type]="type()"
        [placeholder]="placeholder()"
        [autocomplete]="autocomplete()"
        [value]="value()"
        [disabled]="isDisabled()"
        (input)="onInput($event)"
        (blur)="onTouched()"
        [class]="inputClasses()"
      />
      @if (error()) {
        <span class="text-xs text-crimson mt-2 block">{{ error() }}</span>
      } @else if (hint()) {
        <span class="text-xs text-earth/60 mt-2 block">{{ hint() }}</span>
      }
    </label>
  `,
})
export class Input implements ControlValueAccessor {
  label        = input<string>('');
  hint         = input<string>('');
  error        = input<string>('');
  type         = input<'text' | 'email' | 'password'>('text');
  placeholder  = input<string>('');
  autocomplete = input<string>('off');
  textColor    = input<'ink' | 'paper'>('ink');

  value      = signal<string>('');
  isDisabled = signal<boolean>(false);

  private onChangeFn: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  labelClasses = computed(() =>
    `text-xs tracking-widest uppercase mb-2 block ${this.error() ? 'text-crimson' : 'text-earth'}`
  );

  inputClasses = computed(() => {
    const base = 'w-full bg-transparent border-b-2 font-display text-xl font-light py-2 outline-none transition-colors';
    const color = this.textColor() === 'paper' ? 'text-paper placeholder:text-paper/30' : 'text-ink placeholder:text-ink/30';
    return this.error()
      ? `${base} border-crimson text-crimson placeholder:text-crimson/30`
      : `${base} ${color} border-bone focus:border-ember`;
  });

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChangeFn(val);
  }

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
