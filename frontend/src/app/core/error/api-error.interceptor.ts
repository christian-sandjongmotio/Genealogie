import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => next(request).pipe(
  catchError((error: HttpErrorResponse) => {
    const message = typeof error.error?.message === 'string'
      ? error.error.message
      : error.status === 0
        ? 'Le serveur est inaccessible.'
        : `Erreur HTTP ${error.status}`;
    return throwError(() => new Error(message, { cause: error }));
  }),
);
