import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { MonoTypeOperatorFunction, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { ApiErrorResponse } from '../../shared/interfaces/api-error.interface';

export function catchFormError<T>(
  form: FormGroup,
  toastr: ToastrService,
): MonoTypeOperatorFunction<T> {
  return catchError((e: HttpErrorResponse) => {
    const body = e.error as ApiErrorResponse | null;
    switch (e.status) {
      case 400:
      case 422: {
        const fieldErrors = body?.errors ?? {};
        if (Object.keys(fieldErrors).length) {
          Object.entries(fieldErrors).forEach(([field, msgs]) =>
            form.get(field)?.setErrors({ backend: msgs.join('\n') }),
          );
        } else {
          toastr.error(body?.message ?? 'Datos inválidos.');
        }
        break;
      }
      case 409:
        toastr.error(body?.message ?? 'Ya existe un registro con estos datos.');
        break;
    }
    return throwError(() => e);
  });
}
