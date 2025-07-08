export interface HouseholdMember {
  id: number;
  userId: number;
  householdId: number;
}

// Interface para crear (sin id)
export interface CreateHouseholdMemberRequest {
  userId: number;
  householdId: number;
}
