import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { Button } from '../button/button';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

@Component({
  selector: 'app-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  templateUrl: './calendar.html',
})
export class Calendar {
  value       = input<Date | null>(null);
  minDate     = input<Date | null>(null);
  valueChange = output<Date>();
  timeChange  = output<string>();
  showTime    = input<boolean>(true);
  timeLabel   = input<string>('Hora de inicio');

  private readonly today = new Date();

  viewYear     = signal(this.today.getFullYear());
  viewMonth    = signal(this.today.getMonth());
  selectedDate = signal<Date | null>(null);
  selectedTime = signal('18:00');

  readonly dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  monthLabel = computed(() => `${MONTHS[this.viewMonth()]} ${this.viewYear()}`);

  calendarDays = computed((): (Date | null)[] => {
    const year  = this.viewYear();
    const month = this.viewMonth();
    const firstDow    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    return cells;
  });

  constructor() {
    effect(() => {
      const v = this.value();
      if (v) {
        this.selectedDate.set(v);
        this.viewYear.set(v.getFullYear());
        this.viewMonth.set(v.getMonth());
        const h = String(v.getHours()).padStart(2, '0');
        const m = String(v.getMinutes()).padStart(2, '0');
        this.selectedTime.set(`${h}:${m}`);
      }
    });
  }

  prevMonth(): void {
    const min = this.minDate();
    if (min && this.viewYear() === min.getFullYear() && this.viewMonth() === min.getMonth()) return;
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update(y => y - 1);
    } else {
      this.viewMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update(y => y + 1);
    } else {
      this.viewMonth.update(m => m + 1);
    }
  }

  isDisabled(date: Date): boolean {
    const min = this.minDate();
    if (!min) return false;
    const minDay  = new Date(min.getFullYear(),  min.getMonth(),  min.getDate());
    const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return dateDay < minDay;
  }

  selectDate(date: Date): void {
    if (this.isDisabled(date)) return;
    const [h, m] = this.selectedTime().split(':').map(Number);
    const combined = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0);
    this.selectedDate.set(combined);
    this.valueChange.emit(combined);
  }

  onTimeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this.selectedTime.set(value);
    this.timeChange.emit(value);
    const sel = this.selectedDate();
    if (!sel) return;
    const [h, m] = value.split(':').map(Number);
    const combined = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate(), h, m, 0);
    this.selectedDate.set(combined);
    this.valueChange.emit(combined);
  }

  isSelected(date: Date): boolean {
    const sel = this.selectedDate();
    if (!sel) return false;
    return sel.getFullYear() === date.getFullYear()
        && sel.getMonth()    === date.getMonth()
        && sel.getDate()     === date.getDate();
  }

  isToday(date: Date): boolean {
    return this.today.getFullYear() === date.getFullYear()
        && this.today.getMonth()    === date.getMonth()
        && this.today.getDate()     === date.getDate();
  }

  dayClass(date: Date): string {
    const base = 'w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors mx-auto';
    if (this.isDisabled(date)) return `${base} text-paper/20 cursor-not-allowed`;
    if (this.isSelected(date)) return `${base} bg-ember text-ink font-semibold cursor-pointer`;
    if (this.isToday(date))    return `${base} text-ember hover:bg-ink-soft cursor-pointer`;
    return `${base} text-paper/80 hover:bg-ink-soft cursor-pointer`;
  }
}
