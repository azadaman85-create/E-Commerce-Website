import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/storefront/AuthForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or create your MI TRENDS account.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const next = searchParams.next;
    redirect(next?.startsWith("/") ? next : "/account");
  }

  return (
    <div className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}
