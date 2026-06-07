import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { authInterceptor } from './common/interceptors/auth-interceptor';
import { errorInterceptor } from './common/interceptors/error-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideToastr({ positionClass: 'toast-bottom-center', timeOut: 4000, preventDuplicates: true }),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ]
};
