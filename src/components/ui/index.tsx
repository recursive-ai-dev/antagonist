import { motion, AnimatePresence, Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useReducedMotion, useAccessibleTooltip, useFocusTrap } from '@/hooks/useAccessibility';
import { useEffect, useRef } from 'react';
import { buttonVariants, modalVariants, overlayVariants, tooltipVariants, cardVariants, switchThumbTransition, progressFillTransition } from '@/utils/motionPresets';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[90vw] max-h-[90vh]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  initialFocusRef,
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[90vw] max-h-[90vh]',
  };

  const modalContentRef = useRef<HTMLDivElement>(null);
  const { containerRef: focusTrapRef } = useFocusTrap(isOpen, onClose, modalContentRef);
  const prefersReducedMotion = useReducedMotion();

  // Set initial focus when modal opens
  useEffect(() => {
    if (isOpen) {
      const focusElement = initialFocusRef?.current || modalContentRef.current?.querySelector('button') || modalContentRef.current;
      if (focusElement && 'focus' in focusElement) {
        setTimeout(() => {
          (focusElement as HTMLElement).focus();
        }, prefersReducedMotion ? 0 : 50);
      }
    }
  }, [isOpen, initialFocusRef, prefersReducedMotion]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 modal-overlay"
            style={{
              background: 'var(--surface-modal-overlay)',
              backdropFilter: 'blur(8px)'
            }}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby="modal-description"
          >
            <motion.div
              ref={modalContentRef}
              className={cn(
                'w-full modal-content rounded-xl overflow-hidden',
                sizeClasses[size]
              )}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                background: 'var(--surface-modal)',
                border: '1px solid var(--border-modal)',
                boxShadow: 'var(--shadow-4)'
              }}
            >
              {/* Header */}
              {(title || showClose) && (
                <div
                  id="modal-description"
                  className="flex items-center justify-between px-6 py-4 border-b"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    background: 'var(--surface-modal-header)'
                  }}
                >
                  {title && (
                    <h2 
                      id="modal-title"
                      className="text-xl font-semibold text-[var(--text-primary)] font-rajdhani tracking-wide"
                    >
                      {title}
                    </h2>
                  )}
                  {showClose && (
                    <button
                      ref={initialFocusRef}
                      onClick={onClose}
                      className="p-1 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--clay-orange)] focus-visible:ring-offset-[var(--soil-deep)]"
                      style={{ '--tw-ring-offset-width': '2px' } as React.CSSProperties}
                      aria-label="Close modal"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--soil-medium)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <X className="w-5 h-5 text-[var(--text-tertiary)]" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div 
                ref={focusTrapRef as React.RefObject<HTMLDivElement>}
                className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]"
                style={{ color: 'var(--text-primary)' }}
              >
                {children}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean;
  'aria-describedby'?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  onClick,
  type = 'button',
  title,
  tabIndex,
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHasPopup,
  'aria-describedby': ariaDescribedBy,
}: ButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  const variantClasses = {
    primary: 'chitin-button',
    secondary: 'chitin-button opacity-80',
    ghost: 'bg-transparent hover:bg-[var(--soil-medium)] text-[var(--text-secondary)]',
    danger: 'bg-[var(--error)]/20 hover:bg-[var(--error)]/30 text-[var(--error)] border-[var(--error)]/50',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-sm min-h-[40px]',
    lg: 'px-6 py-3 text-base min-h-[48px]',
  };

  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--clay-orange)] focus-visible:ring-offset-[var(--soil-dark)]',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      variants={buttonVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      type={type}
      title={title}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled || loading}
      style={{
        minHeight: size === 'sm' ? 'var(--button-height-sm)' : size === 'lg' ? 'var(--button-height-lg)' : 'var(--button-height-md)',
        fontSize: size === 'sm' ? 'var(--type-button-sm)' : size === 'lg' ? 'var(--type-button-lg)' : 'var(--type-button-md)',
      }}
    >
      {loading && (
        <motion.div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          aria-hidden="true"
        />
      )}
      {loading && <span className="sr-only">Loading...</span>}
      {icon}
      {children}
    </motion.button>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  variant?: 'awareness' | 'sentience' | 'default';
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  value,
  max,
  label,
  variant = 'default',
  showValue = true,
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const fillClasses = {
    awareness: 'progress-fill-awareness',
    sentience: 'progress-fill-sentience',
    default: 'bg-[var(--clay-orange)]',
  };

  const progressId = label ? `progress-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined;

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between mb-1">
          {label && (
            <span 
              id={progressId ? `${progressId}-label` : undefined}
              className="text-xs text-[var(--text-tertiary)]"
            >
              {label}
            </span>
          )}
          {showValue && (
            <span 
              id={progressId ? `${progressId}-value` : undefined}
              className="text-xs text-[var(--text-secondary)]"
              aria-live="polite"
              aria-atomic="true"
            >
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'progress-bar rounded-full overflow-hidden',
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-labelledby={progressId ? `${progressId}-label` : undefined}
        aria-describedby={progressId ? `${progressId}-value` : undefined}
        aria-live="polite"
        style={{
          height: size === 'sm' ? 'var(--progress-height-sm)' : size === 'lg' ? 'var(--progress-height-lg)' : 'var(--progress-height-md)',
          background: 'var(--surface-progress-track)',
          border: '1px solid var(--border-progress)',
        }}
      >
        <motion.div
          className={cn('h-full rounded-full transition-all', fillClasses[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={progressFillTransition}
          style={{ willChange: 'width' }}
        />
      </div>
    </div>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'interactive' | 'info';
  'aria-label'?: string;
}

export function Card({ 
  children, 
  className, 
  hover = true, 
  onClick,
  variant = 'default',
  'aria-label': ariaLabel
}: CardProps) {
  const isInteractive = !!onClick;
  const prefersReducedMotion = useReducedMotion();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <motion.div
      className={cn(
        'info-card rounded-lg p-4',
        isInteractive ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-orange)]' : '',
        className
      )}
      variants={cardVariants}
      initial="idle"
      whileHover={hover && !prefersReducedMotion && isInteractive ? 'hover' : undefined}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : 'region'}
      aria-label={ariaLabel}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-card)',
        padding: 'var(--card-padding)',
      }}
    >
      {children}
    </motion.div>
  );
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
}

export function Tooltip({ content, children, side = 'top', disabled }: TooltipProps) {
  const { isVisible, triggerRef, triggerProps, tooltipProps } = useAccessibleTooltip(content, disabled);
  const prefersReducedMotion = useReducedMotion();

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef as React.RefObject<HTMLDivElement>}
        {...triggerProps}
        className="inline-block"
      >
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={cn(
              'absolute z-50 px-2 py-1 text-xs text-[var(--text-primary)] bg-[var(--surface-tooltip)] border border-[var(--border-tooltip)] rounded pointer-events-none whitespace-nowrap',
              positionClasses[side]
            )}
            initial="hidden"
            animate="visible"
            exit="exit"
            custom={side}
            variants={tooltipVariants}
            transition={{ duration: prefersReducedMotion ? 0 : undefined }}
            {...tooltipProps}
            style={{
              boxShadow: 'var(--shadow-2)',
            }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'rare' | 'epic' | 'legendary';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  'aria-label'?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', icon, 'aria-label': ariaLabel }: BadgeProps) {
  const variantClasses = {
    default: 'bg-[var(--soil-medium)] text-[var(--text-secondary)]',
    success: 'bg-[var(--success)]/20 text-[var(--success)]',
    warning: 'bg-[var(--warning)]/20 text-[var(--warning)]',
    error: 'bg-[var(--error)]/20 text-[var(--error)]',
    rare: 'bg-[var(--rarity-rare)]/20 text-[var(--rarity-rare)]',
    epic: 'bg-[var(--rarity-epic)]/20 text-[var(--rarity-epic)]',
    legendary: 'bg-[var(--rarity-legendary)]/20 text-[var(--rarity-legendary)]',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded font-medium',
        variantClasses[variant],
        sizeClasses[size]
      )}
      aria-label={ariaLabel}
      role="status"
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

interface ScrollPanelProps {
  children: React.ReactNode;
  className?: string;
  autoScroll?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

export function ScrollPanel({ children, className, autoScroll = false, ref }: ScrollPanelProps) {
  return (
    <div
      ref={ref}
      data-auto-scroll={autoScroll}
      className={cn(
        'scrollable-panel overflow-y-auto',
        className
      )}
    >
      {children}
    </div>
  );
}

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Divider({ orientation = 'horizontal', className }: DividerProps) {
  return (
    <div
      className={cn(
        'bg-[var(--border-subtle)]',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        className
      )}
    />
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className, label = 'Loading' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <>
      <span className="sr-only">{label}</span>
      <motion.div
        className={cn(
          'border-2 border-[var(--clay-orange)]/30 border-t-[var(--clay-orange)] rounded-full',
          sizeClasses[size],
          className
        )}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        role="status"
        aria-label={label}
      />
    </>
  );
}

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  valueLabel?: string;
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  showValue = false,
  valueLabel,
}: SliderProps) {
  const sliderId = `slider-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const valueTextId = `${sliderId}-value`;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label id={`${sliderId}-label`} className="text-sm text-[var(--text-secondary)] font-medium">
          {label}
        </label>
        {showValue && (
          <span id={valueTextId} className="text-sm text-[var(--text-primary)] font-semibold" aria-live="polite">
            {valueLabel || Math.round(value * 100)}%
          </span>
        )}
      </div>
      <input
        type="range"
        id={sliderId}
        aria-labelledby={`${sliderId}-label`}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={valueLabel || `${Math.round(value * 100)}%`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-[var(--soil-deep)] rounded-lg appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--clay-orange)]
          [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110
          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-[var(--clay-orange)] [&::-moz-range-thumb]:border-0"
      />
    </div>
  );
}

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export function Switch({ label, checked, onChange, description }: SwitchProps) {
  const switchId = `switch-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <label id={`${switchId}-label`} htmlFor={switchId} className="text-base text-[var(--text-primary)] font-medium cursor-pointer">
          {label}
        </label>
        {description && (
          <div id={`${switchId}-desc`} className="text-sm text-[var(--text-secondary)]">{description}</div>
        )}
      </div>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${switchId}-label`}
        aria-describedby={description ? `${switchId}-desc` : undefined}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-12 h-7 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soil-dark)]',
          checked ? 'bg-[var(--surface-switch-track-on)]' : 'bg-[var(--surface-switch-track-off)]'
        )}
        style={{
          width: 'var(--switch-track-width)',
          height: 'var(--switch-track-height)',
        }}
      >
        <motion.div
          className={cn(
            'absolute top-1 w-5 h-5 rounded-full bg-[var(--surface-switch-thumb)]',
            checked ? 'right-1' : 'left-1'
          )}
          layout={!prefersReducedMotion}
          transition={switchThumbTransition}
          style={{
            width: 'var(--switch-thumb-size)',
            height: 'var(--switch-thumb-size)',
          }}
        />
      </button>
    </div>
  );
}
