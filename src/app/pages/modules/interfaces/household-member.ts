export interface HouseholdMember {
  id: number;
  userId: number;
  householdId: number;
}

export interface CreateHouseholdMemberRequest {
  userId: number;
  householdId: number;
}
