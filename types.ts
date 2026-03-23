
export type Gender = 'Male' | 'Female' | 'Other';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  location: string;
  flag: string;
  bio: string;
  imageUrl: string;
  isOnline: boolean;
  isPremium: boolean;
  languages: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export type AppView = 'explore' | 'chat' | 'premium' | 'profile' | 'live';
