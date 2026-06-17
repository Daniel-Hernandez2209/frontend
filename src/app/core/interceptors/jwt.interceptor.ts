import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // withCredentials permite que el navegador envíe las cookies HttpOnly automáticamente
    const secureReq = req.clone({ withCredentials: true });
    return next.handle(secureReq);
  }
}
