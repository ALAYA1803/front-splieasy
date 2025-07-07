import { TestBed } from '@angular/core/testing';

import { HouseholdMemberService } from './household-member.service';

describe('HouseholdMemberService', () => {
  let service: HouseholdMemberService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HouseholdMemberService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
