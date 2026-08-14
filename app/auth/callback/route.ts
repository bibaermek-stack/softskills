import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

function safeRedirectPath(value: string | null, requestUrl: URL): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";

  const destination = new URL(value, requestUrl);
  return destination.origin === requestUrl.origin
    ? `${destination.pathname}${destination.search}${destination.hash}`
    : "/dashboard";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedRole = requestUrl.searchParams.get("role");
  const role = requestedRole === "student" || requestedRole === "teacher" ? requestedRole : null;
  const next = safeRedirectPath(requestUrl.searchParams.get("next"), requestUrl);

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      });

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError && role) {
        const { error: roleError } = await supabase.rpc("claim_role", { p_role: role });
        // An existing account already has an immutable role. Other failures leave
        // the profile provisional, and the dashboard opens the role picker.
        if (roleError && !roleError.message.toLowerCase().includes("already been chosen")) {
          console.error("Unable to claim OAuth role:", roleError.message);
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
