import { createContext, useContext } from "react";
import type { EditPlan } from "../types/edit-plan";

const EditPlanContext = createContext<EditPlan | null>(null);

export const EditPlanProvider = EditPlanContext.Provider;

export function useEditPlan(): EditPlan {
  const plan = useContext(EditPlanContext);

  if (!plan) {
    throw new Error("ERROR:\nVideo engine is missing an edit plan.");
  }

  return plan;
}
