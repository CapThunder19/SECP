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


const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-80 disabled:grayscale-[0.3] select-none uppercase tracking-tight',
    {
        variants: {
            variant: {
                default: 'bg-primary text-white border-2 border-black/10 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0px_0px_rgba(35,30,25,1)] hover:shadow-[4px_4px_0px_0px_rgba(35,30,25,1)]',
                glow: 'bg-primary text-white border-2 border-primary-foreground/20 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 shadow-[4px_4px_0px_0px_rgba(35,30,25,1)]',
                destructive: 'bg-red-500 text-white border-2 border-border/20 hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(35,30,25,1)]',
                outline: 'border-2 border-border/20 bg-transparent hover:bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(35,30,25,1)]',
                secondary: 'bg-[#F3DFC1] text-black border-2 border-border/20 hover:bg-[#F3DFC1]/80 shadow-[2px_2px_0px_0px_rgba(35,30,25,1)]',
                ghost: 'hover:bg-neutral-100 text-neutral-600',
                link: 'text-primary underline-offset-4 hover:underline lowercase font-normal',
            },
            size: {
                default: 'h-11 px-6 py-2',
                sm: 'h-9  px-4 text-xs',
                lg: 'h-14 px-10 text-base',
                icon: 'h-10 w-10',
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
        <h3 ref={ref} className={cn('text-xl font-bold leading-none tracking-tight text-foreground uppercase', className)} {...props} />
    )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => <p ref={ref} className={cn('text-sm text-neutral-500 font-normal leading-relaxed', className)} {...props} />
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-2', className)} {...props} />
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn('flex items-center p-6 bg-secondary/30 border-t border-black', className)} {...props} />
);
CardFooter.displayName = 'CardFooter';

/* ─────────────────────────────────────────
   BADGE
───────────────────────────────────────── */
const badgeVariants = cva(
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-[#d0e8ff] text-neutral-700',
                success: 'bg-[#e4f2e6] text-neutral-700',
                warning: 'bg-[#fdf2d9] text-neutral-700',
                destructive: 'bg-[#fad9d9] text-neutral-700',
                outline: 'border border-border/20 text-neutral-700 bg-white',
                secondary: 'bg-[#f3dec1] text-neutral-700',
                eth: 'bg-[#fad9d9] text-neutral-700',
                cowork: 'bg-[#f3dec1] text-neutral-700',
                conf: 'bg-[#d0e8ff] text-neutral-700',
            },
        },
        defaultVariants: { variant: 'default' },
    }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> { }

export function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}


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
