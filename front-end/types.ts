
export interface WatchAnalysis {
  brand: string;
  type: string;
  features: string;
}

export interface RepairItem {
  id: string;
  user_phone: string;
  customerName: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  date: string;
  imageUrl?: string;
  analysis?: WatchAnalysis;
}

export type ViewState = 'LANDING' | 'LOGIN' | 'HOME' | 'ADD_REPAIR' | 'PROFILE' | 'REPAIR_DETAILS';
