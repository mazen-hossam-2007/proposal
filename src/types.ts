export interface DateProposalState {
  hasSaidYes: boolean;
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

export interface DateSubmissionRecord extends DateProposalState {
  id: string;
  submittedAt: string;
}
