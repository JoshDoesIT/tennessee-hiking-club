import { pageMetadata } from "@/lib/page-metadata";
import { Container } from "@/components/ui/container";
import { SignInOptions } from "@/components/auth/sign-in-options";

export const metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to sync your hikes across devices.",
  path: "/signin",
  noindex: true,
});

export default function SignInPage() {
  return (
    <Container className="max-w-md py-16 sm:py-24">
      <p className="eyebrow text-amber-700">Your Tennessee</p>
      <h1 className="display text-forest mt-3 text-4xl">Sign in</h1>
      <p className="text-ink/70 mt-4 leading-relaxed">
        Sign in to sync your hikes across devices and back them up. Your log
        stays private, signing in is optional, and you can keep hiking without
        it.
      </p>
      <div className="mt-8">
        <SignInOptions />
      </div>
    </Container>
  );
}
