"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Checkbox } from "@/components/ui/Input";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { EASE_TACTILE } from "@/lib/motion";
import type { Address, AddressInput } from "@/types";

const EMPTY: AddressInput = {
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip: "",
  country: "India",
  is_default: false,
};

export function AddressBook({
  initialAddresses,
  userId,
}: {
  initialAddresses: Address[];
  userId: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<Address | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AddressInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Address | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(address: Address) {
    setEditing(address);
    setForm({
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      is_default: address.is_default,
    });
    setErrors({});
    setFormOpen(true);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.full_name.trim()) next.full_name = "Required.";
    if (!form.address_line1.trim()) next.address_line1 = "Required.";
    if (!form.city.trim()) next.city = "Required.";
    if (!form.state.trim()) next.state = "Required.";
    if (!form.zip.trim()) next.zip = "Required.";
    if (!form.country.trim()) next.country = "Required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function reload() {
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setAddresses((data as Address[]) ?? []);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = { ...form, user_id: userId };
      const { error } = editing
        ? await supabase.from("addresses").update(payload).eq("id", editing.id)
        : await supabase.from("addresses").insert(payload);

      if (error) {
        toast.error("Couldn't save the address", error.message);
        return;
      }

      // The DB trigger clears other defaults, so reload rather than patching
      // local state and risking two addresses both showing as default.
      await reload();
      setFormOpen(false);
      toast.success(editing ? "Address updated" : "Address saved");
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault(address: Address) {
    const { error } = await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", address.id);

    if (error) {
      toast.error("Couldn't set the default", error.message);
      return;
    }
    await reload();
    toast.success("Default address updated");
  }

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await supabase.from("addresses").delete().eq("id", deleting.id);

    if (error) {
      toast.error("Couldn't delete the address", error.message);
      return;
    }
    setAddresses((prev) => prev.filter((a) => a.id !== deleting.id));
    setDeleting(null);
    toast.success("Address deleted");
  }

  const fieldGrid = "grid gap-5 sm:grid-cols-2";

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h2 className="font-serif text-2xl text-ink">Saved addresses</h2>
        <Button onClick={openCreate} variant="secondary">
          <Plus className="h-4 w-4" aria-hidden />
          Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="card-surface">
          <EmptyState
            illustration="box"
            title="No addresses saved"
            description="Add an address to check out faster next time."
            action={<Button onClick={openCreate}>Add your first address</Button>}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {addresses.map((address) => (
              <motion.div
                key={address.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25, ease: EASE_TACTILE }}
                className="card-surface flex flex-col p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-body-sm font-medium text-ink">
                    {address.full_name}
                  </span>
                  {address.is_default && <Badge tone="accent">Default</Badge>}
                </div>

                <address className="mt-3 flex-1 not-italic text-body-sm leading-relaxed text-muted">
                  {address.address_line1}
                  {address.address_line2 && (
                    <>
                      <br />
                      {address.address_line2}
                    </>
                  )}
                  <br />
                  {address.city}, {address.state} {address.zip}
                  <br />
                  {address.country}
                  {address.phone && (
                    <>
                      <br />
                      {address.phone}
                    </>
                  )}
                </address>

                <div className="mt-6 flex items-center gap-1 border-t border-hairline pt-4">
                  <button
                    type="button"
                    onClick={() => openEdit(address)}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-caption normal-case tracking-normal text-muted transition-colors hover:bg-ink/5 hover:text-ink"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    Edit
                  </button>

                  {!address.is_default && (
                    <button
                      type="button"
                      onClick={() => makeDefault(address)}
                      className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-caption normal-case tracking-normal text-muted transition-colors hover:bg-ink/5 hover:text-ink"
                    >
                      <Star className="h-3.5 w-3.5" aria-hidden />
                      Set default
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeleting(address)}
                    className="ml-auto flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-caption normal-case tracking-normal text-muted transition-colors hover:bg-danger/8 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit address" : "Add an address"}
      >
        <form onSubmit={save} className="flex flex-col gap-5 p-6">
          <div className={fieldGrid}>
            <Input
              label="Full name"
              required
              value={form.full_name}
              error={errors.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <Input
              label="Phone"
              type="tel"
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <Input
            label="Address line 1"
            required
            value={form.address_line1}
            error={errors.address_line1}
            onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
          />
          <Input
            label="Address line 2"
            value={form.address_line2 ?? ""}
            onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
          />

          <div className={fieldGrid}>
            <Input
              label="City"
              required
              value={form.city}
              error={errors.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Input
              label="State / Province"
              required
              value={form.state}
              error={errors.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </div>

          <div className={fieldGrid}>
            <Input
              label="ZIP / Postal code"
              required
              value={form.zip}
              error={errors.zip}
              onChange={(e) => setForm({ ...form, zip: e.target.value })}
            />
            <Input
              label="Country"
              required
              value={form.country}
              error={errors.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>

          <Checkbox
            label="Make this my default address"
            checked={form.is_default}
            onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
          />

          <div className="mt-3 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Add address"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this address?"
        message="This cannot be undone. Orders already placed keep their own copy of the address."
      />
    </div>
  );
}
