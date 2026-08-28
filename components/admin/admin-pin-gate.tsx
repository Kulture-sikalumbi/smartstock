"use client";

import {
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ADMIN_PIN = "1234";
const STORAGE_KEY = "smartstock-admin-unlocked";

type Listener = () => void;
const listeners = new Set<Listener>();

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return window.sessionStorage.getItem(STORAGE_KEY) === "true";
}

function getServerSnapshot() {
  return false;
}

function unlockSession() {
  window.sessionStorage.setItem(STORAGE_KEY, "true");
  listeners.forEach((listener) => listener());
}

export function AdminPinGate({ children }: { children: ReactNode }) {
  const unlocked = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      unlockSession();
      setError("");
    } else {
      setError("Incorrect PIN. Please try again.");
      setPin("");
    }
  }

  if (!unlocked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-50 px-4 py-4 overflow-y-auto">
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-sm flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-semibold text-zinc-900">
              Admin access
            </h1>
            <p className="text-sm text-zinc-500">
              Enter the admin PIN to continue.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="admin-pin">PIN (4 digits)</Label>
            <Input
              id="admin-pin"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoFocus
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Enter PIN"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <Button type="submit" className="w-full">
            Unlock
          </Button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
