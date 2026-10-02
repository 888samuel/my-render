import editPlanJson from "../src/data/edit_plan.json";
import { validateEditPlan } from "../src/validation/validateEditPlan";
import type { EditPlan } from "../src/types/edit-plan";

const editPlan = editPlanJson as EditPlan;

validateEditPlan(editPlan);
console.log(`Edit plan "${editPlan.video.id}" is structurally valid.`);
