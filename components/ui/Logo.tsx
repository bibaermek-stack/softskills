import { cn } from "@/lib/cn";

export function Logo({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="STEM Soft Skills Platform Logo"
      className={cn(
        "shrink-0 object-cover rounded-full bg-white p-0.5 shadow-sm transition-transform duration-300 hover:scale-105 aspect-square overflow-hidden",
        tone === "dark" && "ring-1 ring-white/10",
        className,
      )}
    />
  );
}

