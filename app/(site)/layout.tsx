import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/**
 * Chrome for the public marketing site.
 *
 * The dashboard at /dashboard sits outside this route group on purpose: it
 * carries its own header, sidebars and footer, and its scrollable panes would
 * fight the Lenis instance this layout mounts.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SmoothScroll>
      <a
        href="#platform"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-brand-600 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Мазмұнға өту
      </a>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </SmoothScroll>
  );
}
