import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isHandledElsewhere = [401, 400, 409, 422].includes(error.status);

      if (!isHandledElsewhere) {
        const message = error.error?.message ?? 'Ocurrió un error inesperado.';
        toastr.error(message);
      }

      return throwError(() => error);
    })
  );
};
