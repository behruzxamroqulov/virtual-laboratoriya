import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

export const SESSION_COOKIE = 'vl_session';
const ALG = 'HS256';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 soat

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET aniqlanmagan yoki juda qisqa. .env faylini tekshiring.');
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string; // userId
  role: 'TEACHER' | 'STUDENT';
  login: string;
};

/** Foydalanuvchi uchun imzolangan, muddatli JWT session token yaratadi. */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

/** Tokenni tekshiradi. Yaroqsiz/eskirgan bo'lsa null qaytaradi (xatolik tashlamaydi). */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
