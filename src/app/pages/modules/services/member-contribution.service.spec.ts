import { TestBed } from '@angular/core/testing';

import { MemberContributionService } from './member-contribution.service';

describe('MemberContributionService', () => {
  let service: MemberContributionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MemberContributionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
