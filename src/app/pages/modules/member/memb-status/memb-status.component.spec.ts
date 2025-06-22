import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembStatusComponent } from './memb-status.component';

describe('MembStatusComponent', () => {
  let component: MembStatusComponent;
  let fixture: ComponentFixture<MembStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MembStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
