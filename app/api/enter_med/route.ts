import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/mongodb";
import medicine from "@/models/medicine";
import z from "zod";
import { v4 as uuidv4 } from "uuid";

const reqSchema= z.object({
    name: z.string(),
  price: z.number(),
  manufacturer_name: z.string(),
  type: z.enum(["allopathy", "ayurvedic", "homeopathy"]),
  pack_size_label: z.string(),
  short_composition1: z.string(),
  is_discontinued: z.boolean(),
})

export async function POST(req: NextRequest){
    try {
        await connectDB();
    
        const body = await req.json();
    
        const parsedBody = reqSchema.safeParse(body);
        if (!parsedBody.success) {
          console.log(parsedBody.error);
          return NextResponse.json(
            { error: "Invalid request data" },
            { status: 400 }
          );
        }

        const{name,price,manufacturer_name,type,pack_size_label,short_composition1,is_discontinued}=parsedBody.data;
        const med = await medicine.findOne({ name });
            if (med)
              return NextResponse.json(
                { error: "Medicine already exists" },
                { status: 400 }
              );

              const newMed=new medicine({
                name,price,manufacturer_name,type,pack_size_label,short_composition1,is_discontinued
              });

              await newMed.save();

              return NextResponse.json(
            { message: "medicine registered successfully" },
            { status: 201 }
    );


    }
    catch(error){
        console.error(error);
            return NextResponse.json(
              { error: "Internal Server Error" },
              { status: 500 }
            );
    }
}