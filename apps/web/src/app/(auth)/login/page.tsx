"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Divider } from "@astryxdesign/core/Divider";
import { GitBranch as Github } from "lucide-react";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    await signIn.email(
      { email, password },
      {
        onSuccess: () => router.push(next ?? "/"),
        onError: (ctx) => {
          setError(ctx.error.message ?? "Couldn't sign in with those details.");
          setIsLoading(false);
        },
      }
    );
  }

  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">
        Welcome back
      </h1>
      <p className="mt-1.5 text-[14px] text-[var(--color-text-secondary)]">Sign in to your workspace.</p>

      <div className="mt-6 grid">
        <Button
          label="Continue with GitHub"
          variant="secondary"
          size="lg"
          icon={<Github className="h-4 w-4" />}
          clickAction={async () => { await signIn.social({ provider: "github", callbackURL: "/" }); }}
        />
      </div>

      <div className="my-5">
        <Divider label="or" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextInput label="Email" type="email" value={email} onChange={setEmail} isRequired />
        <TextInput
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          isRequired
          status={error ? { type: "error", message: error } : undefined}
        />
        <div className="mt-1 grid">
          <Button label="Sign in" type="submit" variant="primary" size="lg" isLoading={isLoading} />
        </div>
      </form>

      <p className="mt-6 text-center text-[13.5px] text-[var(--color-text-secondary)]">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="text-[var(--color-text-accent)] hover:underline">
          Sign up
        </a>
      </p>
    </div>
  );
}


