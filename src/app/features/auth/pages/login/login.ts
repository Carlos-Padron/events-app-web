import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Input } from '../../../../components/input/input';
import { Button } from '../../../../components/button/button';
import { Spinner } from '../../../../components/spinner/spinner';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [ReactiveFormsModule, Input, Button, Spinner],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  isLoading = signal(false);

  get emailError(): string {
    const ctrl = this.form.get('email');
    if (!ctrl?.touched) return '';
    if (ctrl.hasError('required')) return 'El correo es requerido.';
    if (ctrl.hasError('email'))    return 'Ingresa un correo válido.';
    return '';
  }

  get passwordError(): string {
    const ctrl = this.form.get('password');
    if (!ctrl?.touched) return '';
    if (ctrl.hasError('required'))  return 'La contraseña es requerida.';
    if (ctrl.hasError('minlength')) return 'Mínimo 8 caracteres.';
    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    this.isLoading.set(false);
    console.log(this.form.value);
  }
}
