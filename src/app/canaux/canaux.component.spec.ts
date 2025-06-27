// Jasmine imports are global
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CanauxComponent } from './canaux.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CanauxComponent', () => {
  let component: CanauxComponent;
  let fixture: ComponentFixture<CanauxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CanauxComponent,
        HttpClientTestingModule
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CanauxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
