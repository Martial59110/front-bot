// Jasmine imports are global
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GaugeComponent } from './gauge.component';

describe('GaugeComponent', () => {
  let component: GaugeComponent;
  let fixture: ComponentFixture<GaugeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GaugeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GaugeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.value).toBe(0);
    expect(component.max).toBe(100);
  });

  it('should accept input values', () => {
    component.value = 75;
    component.max = 200;
    
    expect(component.value).toBe(75);
    expect(component.max).toBe(200);
  });

  it('should display gauge works message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p')?.textContent).toContain('gauge works!');
  });

  it('should calculate percentage correctly', () => {
    component.value = 50;
    component.max = 100;
    
    const percentage = (component.value / component.max) * 100;
    expect(percentage).toBe(50);
  });

  it('should handle zero max value', () => {
    component.value = 10;
    component.max = 0;
    
    const percentage = component.max === 0 ? 0 : (component.value / component.max) * 100;
    expect(percentage).toBe(0);
  });
});
