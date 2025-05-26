import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanauxComponent } from './canaux.component';

describe('CanauxComponent', () => {
  let component: CanauxComponent;
  let fixture: ComponentFixture<CanauxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanauxComponent]
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
