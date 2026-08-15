import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "../icons";

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

/* ---------------- Button ---------------- */

type Variant = "toolbar" | "accent" | "ghost" | "outline";

export function Button({
  variant = "toolbar",
  icon,
  trailingIcon,
  children,
  className,
  active,
  ...rest
}: {
  variant?: Variant;
  icon?: IconName;
  trailingIcon?: IconName;
  active?: boolean;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "group relative inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

  const variants: Record<Variant, string> = {
    toolbar:
      "border border-line-2 bg-surface px-3.5 text-fg hover:bg-surface-hover active:bg-surface-active",
    outline:
      "border border-line bg-transparent px-3.5 text-fg hover:bg-white/8",
    accent:
      "bg-accent px-3.5 text-fg-inverted hover:bg-accent-hover active:bg-accent-active",
    ghost: "px-2 text-fg-2 hover:bg-white/8 hover:text-fg",
  };

  return (
    <button
      className={cx(
        base,
        variants[variant],
        active && "border-line-2-hover bg-surface-hover",
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} className="shrink-0" />}
      {children}
      {trailingIcon && (
        <Icon name={trailingIcon} className="shrink-0 text-fg-2" />
      )}
    </button>
  );
}

/* ---------------- Icon button ---------------- */

export function IconButton({
  name,
  size = 16,
  active,
  className,
  ...rest
}: {
  name: IconName;
  size?: number;
  active?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        "inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150",
        active
          ? "bg-muted text-accent"
          : "text-fg-2 hover:bg-white/8 hover:text-fg",
        className,
      )}
      {...rest}
    >
      <Icon name={name} size={size} />
    </button>
  );
}

/* ---------------- Segmented view switcher ---------------- */

export function SegmentedIcons({
  options,
  value,
  onChange,
}: {
  options: { value: string; icon: IconName; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          title={o.label}
          aria-label={o.label}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150",
            value === o.value
              ? "bg-muted text-accent"
              : "text-fg-2 hover:bg-white/8 hover:text-fg",
          )}
        >
          <Icon name={o.icon} />
        </button>
      ))}
    </div>
  );
}

/* ---------------- Page chrome ---------------- */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-fg">
        {title}
        {subtitle && (
          <span className="ml-1.5 font-normal text-fg-2">· {subtitle}</span>
        )}
      </h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 px-6">{children}</div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-xl border border-line bg-surface-2/60 p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ---------------- Empty state ---------------- */

export function EmptyState({
  image,
  title,
  description,
  children,
}: {
  image: string;
  title: string;
  description: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <img src={image} alt="" className="mb-6 max-w-[280px]" />
      <h2 className="text-xl font-semibold text-fg">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-fg-2">{description}</p>
      {children && (
        <div className="mt-6 flex items-center gap-3">{children}</div>
      )}
    </div>
  );
}

/* ---------------- Project chip ---------------- */

export function ProjectDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block size-2 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}
