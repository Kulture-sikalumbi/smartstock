"use client";

type DemoAccount = {
  name: string;
  email: string;
  salt: string;
  passwordHash: string;
};

export type DemoCustomer = Pick<DemoAccount, "name" | "email">;

const ACCOUNTS_KEY = "smartstock-demo-accounts";
const SESSION_KEY = "smartstock-demo-session";
const AUTH_EVENT = "smartstock-demo-auth-change";

function readAccounts(): DemoAccount[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(
      (account): account is DemoAccount =>
        typeof account?.name === "string" &&
        typeof account?.email === "string" &&
        typeof account?.salt === "string" &&
        typeof account?.passwordHash === "string"
    );
  } catch {
    return [];
  }
}

function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", data)));
}

export async function createDemoAccount(name: string, email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = readAccounts();
  if (accounts.some((account) => account.email === normalizedEmail)) {
    return { error: "An account with this email already exists in this browser." };
  }

  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const account: DemoAccount = {
    name: name.trim(),
    email: normalizedEmail,
    salt,
    passwordHash: await hashPassword(password, salt),
  };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
  localStorage.setItem(SESSION_KEY, JSON.stringify({ name: account.name, email: account.email }));
  notifyAuthChange();
  return { customer: { name: account.name, email: account.email } };
}

export async function signInDemoAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const account = readAccounts().find((entry) => entry.email === normalizedEmail);
  if (!account || (await hashPassword(password, account.salt)) !== account.passwordHash) {
    return { error: "Email or password is incorrect." };
  }

  const customer = { name: account.name, email: account.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(customer));
  notifyAuthChange();
  return { customer };
}

export function getDemoCustomer(): DemoCustomer | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null");
    if (
      value &&
      typeof value === "object" &&
      "name" in value &&
      "email" in value &&
      typeof value.name === "string" &&
      typeof value.email === "string"
    ) {
      return { name: value.name, email: value.email };
    }
    return null;
  } catch {
    return null;
  }
}

export function signOutDemoAccount() {
  localStorage.removeItem(SESSION_KEY);
  notifyAuthChange();
}

export function subscribeToDemoAuth(callback: () => void) {
  window.addEventListener(AUTH_EVENT, callback);
  return () => window.removeEventListener(AUTH_EVENT, callback);
}
