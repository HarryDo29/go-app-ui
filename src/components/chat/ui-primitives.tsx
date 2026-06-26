import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

// ─── NavBtn ───────────────────────────────────────────────────────────────────
interface NavBtnProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function NavBtn({ icon, label, active, onClick }: NavBtnProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "relative w-11 h-11 rounded-xl flex items-center justify-center transition group",
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
          : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100",
      )}
    >
      {icon}
      <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-neutral-900 dark:bg-neutral-700 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
        {label}
      </span>
    </button>
  );
}

// ─── IconBtn ──────────────────────────────────────────────────────────────────
interface IconBtnProps {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  title?: string;
  className?: string;
  disabled?: boolean;
}

export function IconBtn({ children, onClick, active, title, className, disabled }: IconBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed",
        active
          ? "bg-primary/10 dark:bg-primary/20 text-primary"
          : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100",
        className,
      )}
    >
      {children}
    </button>
  );
}

// ─── QuickAction ──────────────────────────────────────────────────────────────
interface QuickActionProps {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}

export function QuickAction({ icon, label, danger, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs transition",
        danger
          ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
          : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg";
  active?: boolean;
  gradient?: boolean;
  className?: string;
  src?: string;
}

const avatarSizes = {
  sm: "w-8 h-8 text-[11px]",
  md: "w-10 h-10 text-sm",
  lg: "w-20 h-20 text-2xl",
};

export function Avatar({ initials, size = "md", active, gradient, className, src }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold overflow-hidden select-none shrink-0",
        avatarSizes[size],
        src && !hasError
          ? "bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800"
          : gradient
            ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow"
            : active
              ? "bg-primary text-white"
              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200",
        className,
      )}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={initials}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}

// ─── OnlineDot ────────────────────────────────────────────────────────────────
export function OnlineDot() {
  return (
    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900" />
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
interface SectionLabelProps {
  children: ReactNode;
  count?: number;
  action?: { label: string; onClick: () => void };
}

export function SectionLabel({ children, count, action }: SectionLabelProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h5 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {children}
        {count !== undefined && <span className="ml-1 font-normal">({count})</span>}
      </h5>
      {action && (
        <button onClick={action.onClick} className="text-xs text-primary hover:underline">
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── UnreadBadge ──────────────────────────────────────────────────────────────
export function UnreadBadge({ count }: { count: number }) {
  return (
    <span className="text-[10px] font-semibold bg-primary text-white rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center">
      {count}
    </span>
  );
}
