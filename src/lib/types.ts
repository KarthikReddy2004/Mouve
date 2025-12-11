import { type Timestamp } from "firebase/firestore";

export type CategoryType = "REFORMER" | "MAT" | "HOT" | "FITMAX";

export interface Plan {
  id: string;
  name: string;
  code: string;
  category: CategoryType;
  reformerPoints: number;
  matPoints: number;
  hotYogaPoints: number;
  hotPilatesPoints: number;
  durationDays: number;
  price: number;
  description: string;
  popular?: boolean;
  bestValue?: boolean;
  active: boolean;
  createdAt?: Timestamp | null;
}
