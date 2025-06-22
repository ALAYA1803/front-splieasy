import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembHomeComponent } from './memb-home.component';

describe('MembHomeComponent', () => {
  let component: MembHomeComponent;
  let fixture: ComponentFixture<MembHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MembHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
