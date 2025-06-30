import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Le token est maintenant géré par le backend via les cookies httpOnly
  // Pas besoin d'ajouter de header Authorization, le backend lira automatiquement le cookie
  
  return next(request);
}; 