"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";
import type { Profile } from "@/types";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function ProfileSettings({ profile }: { profile: Profile }) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [newEmail, setNewEmail] = useState(profile.email);
  const [savingEmail, setSavingEmail] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() || null, phone: phone.trim() || null })
        .eq("id", profile.id);

      if (error) {
        toast.error("Couldn't save your profile", error.message);
        return;
      }
      toast.success("Profile updated");
    } finally {
      setSavingProfile(false);
    }
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image too large", "Please choose a file under 2 MB.");
      return;
    }

    setUploading(true);
    try {
      // Storage policy requires the first path segment to be the user's id.
      const extension = file.name.split(".").pop() ?? "jpg";
      const path = `${profile.id}/avatar-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });

      if (uploadError) {
        toast.error("Upload failed", uploadError.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      if (updateError) {
        toast.error("Couldn't save your avatar", updateError.message);
        return;
      }

      setAvatarUrl(publicUrl);
      toast.success("Avatar updated");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (newEmail.trim().toLowerCase() === profile.email.toLowerCase()) return;

    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) {
        toast.error("Couldn't change your email", error.message);
        return;
      }
      toast.success("Check your inbox", "Confirm the change from the email we sent.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (password.length < 8) {
      setPasswordError("Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("The two passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error("Couldn't change your password", error.message);
        return;
      }
      setPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-12">
      <section>
        <h2 className="font-serif text-2xl text-ink">Profile</h2>

        <div className="mt-8 flex items-center gap-6">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-cream">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill sizes="80px" className="object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center font-serif text-2xl text-muted">
                {initials(fullName || profile.email)}
              </span>
            )}
            {uploading && (
              <span className="absolute inset-0 flex items-center justify-center bg-ink/40">
                <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden />
              </span>
            )}
          </div>

          <div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={uploadAvatar}
              className="sr-only"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-sm border border-ink/15 px-5 text-caption uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink/45"
            >
              <Camera className="h-4 w-4" aria-hidden />
              Change photo
            </label>
            <p className="mt-2 text-caption normal-case tracking-normal text-muted">
              JPG or PNG, up to 2 MB.
            </p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="mt-8 flex flex-col gap-5">
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div>
            <Button type="submit" loading={savingProfile}>
              Save changes
            </Button>
          </div>
        </form>
      </section>

      <section className="border-t border-hairline pt-12">
        <h2 className="font-serif text-2xl text-ink">Email address</h2>
        <p className="mt-2 text-body-sm text-muted">
          Changing this sends a confirmation link to the new address.
        </p>

        <form onSubmit={changeEmail} className="mt-8 flex flex-col gap-5">
          <Input
            label="Email address"
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <div>
            <Button
              type="submit"
              variant="secondary"
              loading={savingEmail}
              disabled={newEmail.trim().toLowerCase() === profile.email.toLowerCase()}
            >
              Update email
            </Button>
          </div>
        </form>
      </section>

      <section className="border-t border-hairline pt-12">
        <h2 className="font-serif text-2xl text-ink">Password</h2>

        <form onSubmit={changePassword} className="mt-8 flex flex-col gap-5">
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            error={passwordError}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div>
            <Button type="submit" variant="secondary" loading={savingPassword}>
              Update password
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
