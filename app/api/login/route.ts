import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/mongodb";
import z from "zod";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const reqSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const parsedBody = reqSchema.safeParse(body);
    if (!parsedBody.success)
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );

    const { email, password } = parsedBody.data;

    const user = await User.findOne({ email });

    if (!user)
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword)
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );

    if (!process.env.SECRET_KEY) throw new Error("No secret key found");

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    return NextResponse.json(
      {
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
