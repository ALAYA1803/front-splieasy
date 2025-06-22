import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembSettingsComponent } from './memb-settings.component';

describe('MembSettingsComponent', () => {
  let component: MembSettingsComponent;
  let fixture: ComponentFixture<MembSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MembSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
