import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'mint' | 'outline-dark';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-teal text-white shadow-sm hover:bg-teal-700 active:bg-teal-700 disabled:bg-teal/50',
  mint: 'bg-mint text-navy shadow-sm hover:bg-mint-200 active:bg-mint-200 disabled:bg-mint/50',
  secondary:
    'bg-white text-ink ring-1 ring-line shadow-xs hover:bg-canvas hover:ring-navy/15 active:bg-canvas',
  'outline-dark':
    'bg-white/10 text-white ring-1 ring-white/25 backdrop-blur-sm hover:bg-white/15 active:bg-white/20',
  ghost: 'text-ink-muted hover:bg-canvas hover:text-ink active:bg-canvas',
  danger: 'bg-coral text-white shadow-sm hover:bg-coral/90 active:bg-coral/90',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-[9px]',
  md: 'h-10.5 px-4 text-sm gap-2 rounded-control',
  lg: 'h-12.5 px-6 text-[15px] gap-2.5 rounded-control',
};

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children' | 'ref' | 'color'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  success?: boolean;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    success = false,
    icon,
    trailingIcon,
    fullWidth = false,
    className = '',
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const reduceMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={isDisabled}
      whileHover={reduceMotion || isDisabled ? undefined : { y: -1 }}
      whileTap={reduceMotion || isDisabled ? undefined : { scale: 0.975, y: 0 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className={`inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors duration-150 select-none disabled:cursor-not-allowed disabled:opacity-70 ${
        VARIANTS[variant]
      } ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 aria-hidden className="size-4 animate-spin" />
      ) : success ? (
        <span aria-hidden className="inline-flex size-4 items-center justify-center">
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M3 8.5l3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : (
        icon
      )}
      {children}
      {!loading && !success && trailingIcon}
    </motion.button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'ghost' | 'outline' | 'solid' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const ICON_VARIANTS: Record<NonNullable<IconButtonProps['variant']>, string> = {
  ghost: 'text-ink-muted hover:bg-canvas hover:text-ink',
  outline: 'text-ink-muted ring-1 ring-line hover:bg-canvas hover:text-ink',
  solid: 'bg-navy text-white hover:bg-navy-800',
  danger: 'text-coral hover:bg-coral/10',
};

const ICON_SIZES: Record<NonNullable<IconButtonProps['size']>, string> = {
  sm: 'size-8 rounded-lg',
  md: 'size-9.5 rounded-control',
  lg: 'size-11 rounded-control',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', size = 'md', className = '', children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${ICON_VARIANTS[variant]} ${ICON_SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});