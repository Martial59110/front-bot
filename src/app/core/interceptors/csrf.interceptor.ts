import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

export const csrfInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Récupérer le token CSRF du cookie
  const csrfToken = getCookie('XSRF-TOKEN');
  
  if (csrfToken) {
    // Cloner la requête et ajouter le header CSRF
    request = request.clone({
      setHeaders: {
        'X-XSRF-TOKEN': csrfToken
      }
    });
  }

  return next(request);
};

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
} 