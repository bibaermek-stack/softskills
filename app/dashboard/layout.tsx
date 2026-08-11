import { DashThemeShell } from "@/components/dashboard/DashThemeShell";

/**
 * Панельдің қабығы. Негізгі тор да, жеке модуль беттері де осының ішінде
 * ашылады — тақырып, навигация және тема бәріне ортақ.
 */
export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashThemeShell>{children}</DashThemeShell>;
}
