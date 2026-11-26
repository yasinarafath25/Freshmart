import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ─── Button ──────────────────────────────────────────────────────────────────
type Variant = "primary" | "secondary" | "accent" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 shadow-sm",
  secondary: "bg-white text-ink-900 border border-line hover:border-brand-600 hover:text-brand-700",
  outline: "border border-brand-700 text-brand-700 hover:bg-brand-50",
  accent: "bg-sun-400 text-brand-900 hover:bg-sun-300 shadow-sm",
  ghost: "text-ink-600 hover:bg-mint-50 hover:text-brand-700",
  danger: "bg-tomato-600 text-white hover:bg-tomato-500",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-12 px-7 text-base gap-2 rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap",
    variants[variant],
    sizes[size],
    extra,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

// ─── Form fields ─────────────────────────────────────────────────────────────
const fieldBase =
  "w-full rounded-lg border border-line bg-white px-3.5 text-[15px] text-ink-900 placeholder:text-ink-400 transition focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:bg-canvas aria-[invalid=true]:border-tomato-500";

export function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  htmlFor: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-900">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-tomato-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-600">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, error, ...props }: ComponentProps<"input"> & { error?: string }) {
  return (
    <input
      className={cn(fieldBase, "h-11", className)}
      aria-invalid={error ? true : undefined}
      aria-describedby={error && props.id ? `${props.id}-error` : undefined}
      {...props}
    />
  );
}

export function Textarea({ className, error, ...props }: ComponentProps<"textarea"> & { error?: string }) {
  return <textarea className={cn(fieldBase, "py-2.5 min-h-24", className)} aria-invalid={error ? true : undefined} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldBase, "h-11 pr-8", className)} {...props} />;
}

export function Checkbox({ label, className, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("inline-flex items-center gap-2.5 text-sm text-ink-900 cursor-pointer select-none", className)}>
      <input type="checkbox" className="size-4 rounded border-line accent-brand-700" {...props} />
      {label}
    </label>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────
const badgeTones = {
  fresh: "bg-leaf-500 text-white",
  organic: "bg-lime-400 text-brand-900",
  sale: "bg-tomato-500 text-white",
  neutral: "bg-canvas text-ink-600 border border-line",
  green: "bg-brand-50 text-brand-700",
  yellow: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-tomato-600",
  blue: "bg-sky-50 text-sky-800",
  purple: "bg-violet-50 text-violet-800",
};
export function Badge({ tone = "neutral", className, children }: { tone?: keyof typeof badgeTones; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", badgeTones[tone], className)}>
      {children}
    </span>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cn("rounded-2xl border border-line bg-white shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}

// ─── Alert ───────────────────────────────────────────────────────────────────
const alertTones = {
  info: { cls: "bg-sky-50 border-sky-200 text-sky-900", Icon: Info },
  success: { cls: "bg-brand-50 border-brand-100 text-brand-900", Icon: CheckCircle2 },
  warning: { cls: "bg-amber-50 border-amber-200 text-amber-900", Icon: TriangleAlert },
  error: { cls: "bg-red-50 border-red-200 text-tomato-600", Icon: AlertCircle },
};
export function Alert({ tone = "info", children, className }: { tone?: keyof typeof alertTones; children: ReactNode; className?: string }) {
  const { cls, Icon } = alertTones[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-2.5 rounded-xl border px-4 py-3 text-sm", cls, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-canvas px-6 py-14 text-center", className)}>
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-white text-brand-700 shadow-card">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {body && <p className="mt-1 max-w-md text-sm text-ink-600">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-line/60", className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-white p-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/3" />
      <Skeleton className="mt-3 h-10 w-full rounded-xl" />
    </div>
  );
}

export function SectionHeading({ title, action, icon }: { title: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  );
}
