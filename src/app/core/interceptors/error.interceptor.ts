import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Redirection vers la page de login si non authentifié
          this.router.navigate(['/login']);
        }
        
        if (error.status === 403) {
          // Redirection vers la page d'accès refusé
          this.router.navigate(['/forbidden']);
        }

        // Log l'erreur pour le debugging
        console.error('Une erreur est survenue:', error);

        return throwError(() => error);
      })
    );
  }
} 