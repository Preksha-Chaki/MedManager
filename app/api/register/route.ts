import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/mongodb";
import z from "zod";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const reqSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
});

export async function POST(req: NextRequest) {
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

    const { name, email, password, confirmPassword } = parsedBody.data;

    // if (!name || !email || !password || !confirmPassword)
    //   return NextResponse.json(
    //     { error: "All fields are required" },
    //     { status: 400 }
    //   );

    if (password !== confirmPassword)
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );

    const user = await User.findOne({ email });
    if (user)
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );

    const hasedPass = await bcrypt.hash(password, 11);

    const newUser = new User({
      name,
      email,
      password: hasedPass,
    });

    await newUser.save();

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
