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
      }
    });
  }

  prevMonth(): void {
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

  selectDate(date: Date): void {
    this.selectedDate.set(date);
    this.valueChange.emit(date);
  }

  onTimeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this.selectedTime.set(value);
    this.timeChange.emit(value);
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
    if (this.isSelected(date)) return `${base} bg-ember text-ink font-semibold`;
    if (this.isToday(date))    return `${base} text-ember hover:bg-ink`;
    return `${base} text-paper/80 hover:bg-ink`;
  }
}
