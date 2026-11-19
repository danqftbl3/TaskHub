import * as Crypto from 'expo-crypto';

// Local-only demo auth. Passwords are salted + iterated SHA-256 via expo-crypto. There is no server.
const ROUNDS = 1500;
const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

export const newSalt = (): string => hex(Crypto.getRandomBytes(16));

export async function hashPassword(password: string, salt: string): Promise<string> {
  let h = `${salt}:${password}`;
  for (let i = 0; i < ROUNDS; i++) h = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}${h}`);
  return h;
}

export const validEmail = (e: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
