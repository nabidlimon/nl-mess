export interface Mess {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  totalBorders: number;
  managerPhone: string;
  photoUrl: string;
  email: string; // Mess email
  managerIds: string[]; // List of user IDs of the managers
  createdAt?: string;
  status?: 'Pending' | 'Active';
}

export interface UserProfile {
  id: string; // Matches Firebase Auth UID
  name: string;
  email: string;
  role: 'Manager' | 'MealManager' | 'Border';
  // List of messes the user manages or belongs to
  messIds: string[]; 
  // Current active mess ID
  messId?: string; 
  // If Border or MealManager:
  institution?: string;
  phone?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  status?: 'Pending' | 'Active' | 'Inactive'; // Manager needs to approve
  isRegistered?: boolean;
  plainPin?: string;
  createdAt?: string;
  memberships?: Record<string, {
    role: 'Manager' | 'MealManager' | 'Border';
    status: 'Pending' | 'Active' | 'Inactive';
    room?: string;
  }>;
}

// We will keep these interfaces, but add messId to them so data is isolated by mess
export interface Member extends UserProfile {
  room?: string; // Additional info for Border inside a mess
}

export interface Meal {
  id: string;
  messId: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  mealCount: number; // 0, 0.5, 1, 1.5, 2, 2.5, 3
  displayValue?: string; // e.g. "1N", "1D"
  morning?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  guestMorning?: number;
  guestLunch?: number;
  guestDinner?: number;
  pendingGuestMorning?: number;
  pendingGuestLunch?: number;
  pendingGuestDinner?: number;
  createdAt?: string;
}

export interface Deposit {
  id: string;
  messId: string;
  memberId: string;
  amount: number;
  paymentMethod: string;
  notes: string;
  date: string; // YYYY-MM-DD
  createdAt?: string;
}

export interface BazarCost {
  id: string;
  messId: string;
  itemName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchasedBy: string;
  date: string; // YYYY-MM-DD
  createdAt?: string;
  updatedAt?: any;
}

export interface RentRecord {
  id: string;
  messId: string;
  roomNo: string;
  allocatedRent: number; // nirdharito vara
  rentPaid: number; // vara diyeche
  notes: string; // montobbo
  date: string; // YYYY-MM-DD
  serialNo: string; // no. (sequential or reference no.)
  borderName?: string; // name of border (optional)
  createdAt?: string;
  updatedAt?: any;
}

export interface EssentialCost {
  id: string;
  messId: string;
  title: string; // name of expense
  amount: number; // total cost
  date: string; // YYYY-MM-DD
  notes: string; // remarks / montobbo
  createdAt?: string;
  updatedAt?: any;
}

export interface Notification {
  id: string;
  messId: string;
  title: string;
  message: string;
  type: 'JoinRequest' | 'MealUpdate' | 'BazarUpdate' | 'System' | 'notice' | 'registration' | 'approval';
  senderId?: string;
  senderName?: string;
  userId?: string; // For personal notifications
  recipientRoles?: ('Manager' | 'MealManager' | 'Border')[];
  readBy: string[]; // List of user UIDs who read it
  read?: boolean; // Legacy status
  link?: string;
  status: 'Unread' | 'Read';
  createdAt: any;
  actionTaken?: 'approved' | 'declined';
}


