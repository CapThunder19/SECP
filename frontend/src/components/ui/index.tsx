// src/components/ui/index.tsx
// Shadcn-compatible components with Framer Motion + theme support

'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────
   BUTTON
───────────────────────────────────────── */
const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
                glow: 'btn-glow text-white',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                outline: 'border border-input bg-background hover:bg-accent/10 hover:text-accent-foreground',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-accent/10 hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-5 py-2',
                sm: 'h-8  px-3 text-xs',
                lg: 'h-12 px-8 text-base',
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: { variant: 'default', size: 'default' },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
        );
    }
);
Button.displayName = 'Button';

/* ─────────────────────────────────────────
   CARD
───────────────────────────────────────── */
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('glass-card', className)} {...props} />
    )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3 ref={ref} className={cn('font-semibold leading-none tracking-tight text-foreground', className)} {...props} />
    )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
);
CardFooter.displayName = 'CardFooter';

/* ─────────────────────────────────────────
   BADGE
───────────────────────────────────────── */
const badgeVariants = cva(
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-primary/10 text-primary border border-primary/20',
                success: 'bg-green-500/10 text-green-500 border border-green-500/20',
                warning: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
                destructive: 'bg-red-500/10 text-red-500 border border-red-500/20',
                outline: 'border border-input text-foreground',
                secondary: 'bg-secondary text-secondary-foreground',
            },
        },
        defaultVariants: { variant: 'default' },
    }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> { }

export function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/* ─────────────────────────────────────────
   PROGRESS
───────────────────────────────────────── */
export const Progress = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }
>(({ className, value, indicatorClassName, ...props }, ref) => (
    <ProgressPrimitive.Root
        ref={ref}
        className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
        {...props}
    >
        <ProgressPrimitive.Indicator
            className={cn('h-full w-full flex-1 rounded-full transition-all duration-700 ease-out', indicatorClassName ?? 'bg-primary')}
            style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
        />
    </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

/* ─────────────────────────────────────────
   SEPARATOR
───────────────────────────────────────── */
export const Separator = React.forwardRef<
    React.ElementRef<typeof SeparatorPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
    <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
            'shrink-0 bg-border',
            orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
            className
        )}
        {...props}
    />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

/* ─────────────────────────────────────────
   SWITCH (theme toggle)
───────────────────────────────────────── */
export const Switch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
    <SwitchPrimitive.Root
        ref={ref}
        className={cn(
            'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
            className
        )}
        {...props}
    >
        <SwitchPrimitive.Thumb className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
        )} />
    </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

/* ─────────────────────────────────────────
   MOTION VARIANTS (reusable Framer configs)
───────────────────────────────────────── */
export const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const } }),
};

export const fadeIn = {
    hidden: { opacity: 0 },
    visible: (i = 0) => ({ opacity: 1, transition: { delay: i * 0.06, duration: 0.35 } }),
};

export const slideIn = {
    hidden: { opacity: 0, x: -20 },
    visible: (i = 0) => ({ opacity: 1, x: 0, transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' as const } }),
};

export const scaleIn = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' as const } }),
};

/* ─────────────────────────────────────────
   MOTION CARD — animated glass card
───────────────────────────────────────── */
interface MotionCardProps extends HTMLMotionProps<'div'> {
    delay?: number;
}

export function MotionCard({ className, delay = 0, children, ...props }: MotionCardProps) {
    return (
        <motion.div
            className={cn('glass-card', className)}
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            custom={delay}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            {...props}
        >
            {children}
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   STAGGER CONTAINER
───────────────────────────────────────── */
interface StaggerProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export function Stagger({ children, className, delay = 0 }: StaggerProps) {
    return (
        <motion.div
            className={className}
            initial="hidden"
            animate="visible"
            variants={{
                visible: { transition: { staggerChildren: 0.08, delayChildren: delay } },
                hidden: {},
            }}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div className={className} variants={fadeUp}>
            {children}
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   ANIMATED NUMBER (counts up on mount)
───────────────────────────────────────── */
export function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 2 }: {
    value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
    const [display, setDisplay] = React.useState(0);

    React.useEffect(() => {
        const start = Date.now();
        const duration = 800;
        const from = 0;
        const to = value;

        const step = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(from + (to - from) * eased);
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [value]);

    return (
        <span>
            {prefix}{display.toFixed(decimals)}{suffix}
        </span>
    );
}
