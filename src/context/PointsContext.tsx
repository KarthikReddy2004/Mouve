import { createContext } from "react";

export interface UserPoints {
  reformerPoints: number;
  matPoints: number;
  hotPoints: number;
  nutritionPoints: number;
}

export const PointsContext = createContext<UserPoints | null>(null);