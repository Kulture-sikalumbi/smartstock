"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ADMIN_PIN = "1234";
const STORAGE_KEY = "smartstock-admin-unlocked";

interface AdminLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminLoginModal({
  open,
  onOpenChange,
}: AdminLoginModalProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      window.sessionStorage.setItem(STORAGE_KEY, "true");
      setPin("");
      setError("");
      onOpenChange(false);
      router.push("/admin");
    } else {
      setError("Incorrect PIN. Please try again.");
      setPin("");
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setPin("");
      setError("");
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Admin Access
          </DialogTitle>
          <DialogDescription>
            Enter the admin PIN to access the dashboard
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="admin-pin">PIN</Label>
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
      </DialogContent>
    </Dialog>
  );
}
