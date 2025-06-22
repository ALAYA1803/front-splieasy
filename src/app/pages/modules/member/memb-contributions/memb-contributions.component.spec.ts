import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembContributionsComponent } from './memb-contributions.component';

describe('MembContributionsComponent', () => {
  let component: MembContributionsComponent;
  let fixture: ComponentFixture<MembContributionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MembContributionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembContributionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
