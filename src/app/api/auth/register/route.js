import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";

const BCRYPT_ROUNDS = 10;

export async function POST(request) {
  try {
    const body = await request.json();

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }, // 400 = Bad Request
      );
    }
    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: {email},
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "This email is already used, try with different email" },
        { status: 409 },
      );
    }

  const passwordHash  = await bcrypt.hash(password , BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data:{
        name,
        email,
        passwordHash,
        // other fields may be later
    },
    select:{
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
    }
  })

  return NextResponse.json(
    {
    message:'user is created succesfully',
    user
    },
    {status:201},
    
  )


  } catch (error) {
    console.error('[REGISTER_ERROR]', error);
    return NextResponse.json(
    {
    message:'user is not created succesfully'
    },
    {status:500},
    
  );
  }
}
