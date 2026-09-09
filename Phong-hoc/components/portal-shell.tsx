import Link from "next/link"
import { Building2, DoorOpen, ShieldCheck } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function PortalShell({
  role,
  children,
}: {
  role: "admin" | "student"
  children: React.ReactNode
}) {
  const isAdmin = role === "admin"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-background to-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <header className="flex flex-col gap-4 rounded-2xl border border-white/60 bg-white/60 p-5 shadow-[0_8px_30px_rgb(15,23,42,0.06)] backdrop-blur-xl md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Building2 className="size-6" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Học viện Hành chính &amp; Quản trị Công
                </p>
                <h1 className="text-lg font-bold leading-tight text-foreground md:text-xl">
                  Hệ thống quản lý phòng học
                </h1>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                {isAdmin ? "Khu vực quản trị" : "Khu vực sinh viên"}
              </span>
              <ThemeToggle />
            </div>
          </div>

          <nav className="flex flex-wrap gap-2" aria-label="Khu vực hệ thống">
            {!isAdmin ? (
              <PortalLink href="/student" active icon={<DoorOpen className="size-4" />}>
                Tra cứu &amp; mượn phòng
              </PortalLink>
            ) : (
              <PortalLink href="/admin" active icon={<ShieldCheck className="size-4" />}>
                Phân bổ phòng học
              </PortalLink>
            )}
          </nav>
        </header>

        <main className="mt-6">{children}</main>
      </div>
    </div>
  )
}

function PortalLink({
  href,
  active,
  icon,
  children,
}: {
  href: string
  active: boolean
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent",
      ].join(" ")}
    >
      {icon}
      {children}
    </Link>
  )
}
