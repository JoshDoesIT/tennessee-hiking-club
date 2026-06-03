import { Container } from "@/components/ui/container";
import { pageMetadata } from "@/lib/page-metadata";
import { MoreLinks } from "@/components/more-links";
import { AuthControl } from "@/components/auth/auth-control";
import { AdminNavLink } from "@/components/auth/admin-nav-link";

export const metadata = pageMetadata({
  title: "More",
  description: "Account, the club, and other Tennessee Hiking Club pages.",
  path: "/more",
  noindex: true,
});

export default function MorePage() {
  return (
    <Container className="max-w-xl py-12 sm:py-16">
      <h1 className="display text-forest text-4xl">More</h1>

      <section aria-label="Account" className="mt-6">
        <AuthControl />
      </section>

      <nav aria-label="More pages" className="mt-8">
        <MoreLinks />
      </nav>

      <div className="mt-6">
        <AdminNavLink className="text-sm font-medium text-amber-700" />
      </div>
    </Container>
  );
}
