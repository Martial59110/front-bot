import '@testing-library/jasmine-dom';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// Initialisation de l'environnement de test Angular
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

afterEach(() => {
  // Nettoyage du DOM après chaque test
  document.body.innerHTML = '';
}); 