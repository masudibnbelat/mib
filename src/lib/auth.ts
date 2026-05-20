// src/lib/auth.ts

import "server-only";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export type AppTokenPayload = JWTPayload & {
  username: string;
  role: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function generateServerToken(username: string, role: string) {
  return await new SignJWT({ username, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(getJwtSecret());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as AppTokenPayload;
  } catch {
    return null;
  }
}
