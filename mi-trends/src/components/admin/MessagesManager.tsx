"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Download, Mail, MailOpen, Trash2 } from "lucide-react";
import { Column, DataTable, PageHeader } from "@/components/admin/AdminUI";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate, toCsv } from "@/lib/utils";
import { EASE_TACTILE } from "@/lib/motion";
import type { ContactMessage, Subscriber } from "@/types";

type Tab = "enquiries" | "subscribers";

export function MessagesManager({
  messages: initialMessages,
  subscribers: initialSubscribers,
}: {
  messages: ContactMessage[];
  subscribers: Subscriber[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("enquiries");
  const [messages, setMessages] = useState(initialMessages);
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [open, setOpen] = useState<ContactMessage | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    { table: string; id: string; label: string } | null
  >(null);

  const unread = messages.filter((m) => !m.is_read).length;

  /** Opening an enquiry marks it read — the common case, so no extra click. */
  async function openMessage(message: ContactMessage) {
    setOpen(message);
    if (message.is_read) return;

    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, is_read: true } : m)),
    );
    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: true })
      .eq("id", message.id);

    if (error) {
      // Revert so the badge does not lie about what is stored.
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, is_read: false } : m)),
      );
    }
  }

  async function toggleRead(message: ContactMessage) {
    const next = !message.is_read;
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, is_read: next } : m)),
    );

    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: next })
      .eq("id", message.id);

    if (error) {
      toast.error("Couldn't update", error.message);
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, is_read: !next } : m)),
      );
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { table, id } = pendingDelete;

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete", error.message);
      return;
    }

    if (table === "contact_messages") {
      setMessages((p) => p.filter((x) => x.id !== id));
      setOpen(null);
    } else {
      setSubscribers((p) => p.filter((x) => x.id !== id));
    }

    setPendingDelete(null);
    toast.success("Deleted");
  }

  function exportSubscribers() {
    if (subscribers.length === 0) {
      toast.info("Nothing to export", "No subscribers yet.");
      return;
    }

    const csv = toCsv(
      subscribers.map((s) => ({ email: s.email, subscribed_at: s.created_at })),
      ["email", "subscribed_at"],
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${subscribers.length} subscriber(s)`);
  }

  const messageColumns: Column<ContactMessage>[] = [
    {
      key: "from",
      header: "From",
      sortValue: (m) => m.name,
      render: (m) => (
        <div className="flex items-center gap-3">
          {m.is_read ? (
            <MailOpen className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          ) : (
            <Mail className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          )}
          <div className="min-w-0">
            <span
              className={cn(
                "block truncate",
                m.is_read ? "text-ink" : "font-medium text-ink",
              )}
            >
              {m.name}
            </span>
            <span className="block truncate text-caption normal-case tracking-normal text-muted">
              {m.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      sortValue: (m) => m.subject ?? "",
      render: (m) => (
        <span className="text-muted">{m.subject || "(no subject)"}</span>
      ),
    },
    {
      key: "received",
      header: "Received",
      sortValue: (m) => new Date(m.created_at).getTime(),
      render: (m) => (
        <span className="text-muted">{formatDate(m.created_at, true)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (m) => String(m.is_read),
      render: (m) =>
        m.is_read ? (
          <Badge tone="neutral">Read</Badge>
        ) : (
          <Badge tone="accent">New</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-32",
      render: (m) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openMessage(m)}
            className="cursor-pointer rounded-sm px-3 py-1.5 text-caption normal-case tracking-normal text-accent underline underline-offset-4"
          >
            Read
          </button>
          <button
            type="button"
            onClick={() =>
              setPendingDelete({
                table: "contact_messages",
                id: m.id,
                label: `the message from ${m.name}`,
              })
            }
            aria-label={`Delete message from ${m.name}`}
            className="cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-danger/8 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ),
    },
  ];

  const subscriberColumns: Column<Subscriber>[] = [
    {
      key: "email",
      header: "Email",
      sortValue: (s) => s.email,
      render: (s) => (
        <a
          href={`mailto:${s.email}`}
          className="text-ink transition-colors hover:text-accent"
        >
          {s.email}
        </a>
      ),
    },
    {
      key: "joined",
      header: "Subscribed",
      sortValue: (s) => new Date(s.created_at).getTime(),
      render: (s) => (
        <span className="text-muted">{formatDate(s.created_at, true)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-16",
      render: (s) => (
        <button
          type="button"
          onClick={() =>
            setPendingDelete({ table: "subscribers", id: s.id, label: s.email })
          }
          aria-label={`Remove ${s.email}`}
          className="cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-danger/8 hover:text-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Messages"
        description="Contact enquiries from the storefront, and your newsletter list."
        action={
          tab === "subscribers" ? (
            <Button variant="secondary" onClick={exportSubscribers}>
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </Button>
          ) : null
        }
      />

      <div
        className="mb-8 flex gap-1 rounded-sm bg-white p-1 shadow-card"
        role="tablist"
      >
        {(
          [
            ["enquiries", `Enquiries${unread > 0 ? ` (${unread} new)` : ""}`],
            ["subscribers", `Subscribers (${subscribers.length})`],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "shrink-0 cursor-pointer rounded-sm px-5 py-2.5 text-caption uppercase tracking-[0.1em] transition-colors",
              tab === id ? "bg-ink text-white" : "text-muted hover:bg-ink/5 hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "enquiries" ? (
        <DataTable
          rows={messages}
          columns={messageColumns}
          rowKey={(m) => m.id}
          searchValue={(m) => `${m.name} ${m.email} ${m.subject ?? ""} ${m.message}`}
          searchPlaceholder="Search enquiries…"
          emptyMessage="No enquiries yet. Messages from /contact land here."
        />
      ) : (
        <DataTable
          rows={subscribers}
          columns={subscriberColumns}
          rowKey={(s) => s.id}
          searchValue={(s) => s.email}
          searchPlaceholder="Search by email…"
          emptyMessage="No subscribers yet. Newsletter sign-ups land here."
        />
      )}

      <Modal
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open?.subject || "Enquiry"}
        description={open ? `${open.name} · ${open.email}` : undefined}
      >
        {open && (
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={open.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE_TACTILE }}
                className="whitespace-pre-wrap text-body-sm leading-relaxed text-ink"
              >
                {open.message}
              </motion.p>
            </AnimatePresence>

            <p className="mt-6 text-caption normal-case tracking-normal text-muted">
              Received {formatDate(open.created_at, true)}
            </p>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  toggleRead(open);
                  setOpen({ ...open, is_read: !open.is_read });
                }}
              >
                <Check className="h-4 w-4" aria-hidden />
                Mark as {open.is_read ? "unread" : "read"}
              </Button>

              <a
                href={`mailto:${open.email}?subject=${encodeURIComponent(
                  `Re: ${open.subject || "your enquiry"}`,
                )}`}
                className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-sm bg-ink px-6 text-label uppercase tracking-[0.1em] text-white transition-colors hover:bg-black"
              >
                <Mail className="h-4 w-4" aria-hidden />
                Reply by email
              </a>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this?"
        message={`${pendingDelete?.label} will be removed permanently.`}
      />
    </>
  );
}
