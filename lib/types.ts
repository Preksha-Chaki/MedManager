import { Types } from "mongoose";

export interface UserType {
  name: string;
  email: string;
  id: string;
}

// Type for the medicine inside the medicines array in Calc
interface CalcMedicine {
  medicineId: Types.ObjectId;
  quantity: number;
  cost: number;
}

// Type for a Calc doc
interface CalcDocument {
  userId: Types.ObjectId;
  fromDate?: Date;
  toDate?: Date;
  numDays?: number;
  medicines: CalcMedicine[];
  finalCost?: number;
}
