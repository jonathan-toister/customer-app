import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { CustomerStore } from './features/customers/data/customer.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Fetch is the default backend since Angular 22, so withFetch() is no longer needed.
    provideHttpClient(),
    // The app waits for the first load, so customers are on screen at first render.
    // load() never rejects: a failing API shows the error state instead of a blank app.
    provideAppInitializer(() => inject(CustomerStore).load()),
  ],
};
