export interface DateProposalState {
  hasSaidYes: boolean;
  rejectionAttempts: number;
  date: string;
  timeSlot: string;
  customTime: string;
  locations: string[];
  foodCravings: string[];
  specialNote: string;
}

export interface LocationOption {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  bgGradient: string;
  description: string;
}

export interface FoodOption {
  id: string;
  title: string;
  emoji: string;
  description: string;
  category: string;
}

export type ProposalStatus = 'Confirmed' | 'Planning' | 'Completed' | 'Archived';

export interface DateSubmissionRecord extends DateProposalState {
  id: string;
  submittedAt: string;
  status: ProposalStatus;
  partnerName?: string;
  contactPhone?: string;
  internalAdminNotes?: string;
  updatedAt?: string;
  _synced?: boolean;
}

export interface AdminStats {
  totalAccepted: number;
  statusCounts: {
    Confirmed: number;
    Planning: number;
    Completed: number;
    Archived: number;
  };
  totalRejectionsPrevented: number;
  latestSubmission: string | null;
}
