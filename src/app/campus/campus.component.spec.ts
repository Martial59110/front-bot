import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampusComponent } from './campus.component';

describe('CampusComponent', () => {
  let component: CampusComponent;
  let fixture: ComponentFixture<CampusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CampusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
