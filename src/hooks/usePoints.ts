import { useContext } from "react";
import { PointsContext } from "../context/PointsContext";

export const usePoints = () => {
  return useContext(PointsContext);
};