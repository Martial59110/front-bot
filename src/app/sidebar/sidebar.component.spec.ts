// Jasmine imports are global
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SidebarComponent,
        RouterTestingModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have isOpen property initialized to false', () => {
    expect(component.isOpen).toBe(false);
  });

  it('should toggle sidebar when toggleSidebar is called', () => {
    expect(component.isOpen).toBe(false);
    
    component.toggleSidebar();
    expect(component.isOpen).toBe(true);
    
    component.toggleSidebar();
    expect(component.isOpen).toBe(false);
  });

  it('should close sidebar when closeSidebar is called', () => {
    component.isOpen = true;
    component.closeSidebar();
    expect(component.isOpen).toBe(false);
  });
});
