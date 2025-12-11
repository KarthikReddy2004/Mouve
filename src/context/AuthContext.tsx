import { createContext, type Context } from "react";
import type { User } from "firebase/auth";

export interface AuthContextType {
  user: User | null;
  profile: Record<string, unknown> | null;
  isUserOnboarded: boolean | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateOnboardingStatus: (status: boolean) => void;
}

export const AuthContext: Context<AuthContextType> = createContext<AuthContextType>({
  user: null,
  profile: null,
  isUserOnboarded: null,
  loading: true,
  logout: async () => {},
  updateOnboardingStatus: () => {},
});
