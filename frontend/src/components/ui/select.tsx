'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

const MOBILE_SHEET_BODY_CLASS = 'select-mobile-sheet-open';
const MOBILE_QUERY = '(max-width: 767px)';

/** Contador global: vários Selects abertos sem deixar classe órfã no body. */
let mobileSheetOpenCount = 0;

function acquireMobileSheetBackdrop() {
  if (typeof document === 'undefined') return;
  if (!window.matchMedia(MOBILE_QUERY).matches) return;
  mobileSheetOpenCount += 1;
  document.body.classList.add(MOBILE_SHEET_BODY_CLASS);
}

function releaseMobileSheetBackdrop() {
  if (typeof document === 'undefined') return;
  mobileSheetOpenCount = Math.max(0, mobileSheetOpenCount - 1);
  if (mobileSheetOpenCount === 0) {
    document.body.classList.remove(MOBILE_SHEET_BODY_CLASS);
  }
}

type SelectProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>;

/**
 * Controla open para aplicar backdrop via classe no body (CSS),
 * sem Portal React — evita tela preta por overlay órfão.
 */
function Select({
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: SelectProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false,
  );
  const isControlled = openProp !== undefined;
  const open = isControlled ? Boolean(openProp) : uncontrolledOpen;
  const wasOpenRef = React.useRef(false);

  React.useEffect(() => {
    if (open && !wasOpenRef.current) {
      acquireMobileSheetBackdrop();
      wasOpenRef.current = true;
    } else if (!open && wasOpenRef.current) {
      releaseMobileSheetBackdrop();
      wasOpenRef.current = false;
    }
  }, [open]);

  React.useEffect(() => {
    return () => {
      if (wasOpenRef.current) {
        releaseMobileSheetBackdrop();
        wasOpenRef.current = false;
      }
    };
  }, []);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <SelectPrimitive.Root
      open={open}
      onOpenChange={handleOpenChange}
      {...props}
    />
  );
}

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      'flex cursor-pointer items-center justify-center py-1 max-md:hidden',
      className,
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      'flex cursor-pointer items-center justify-center py-1 max-md:hidden',
      className,
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

/**
 * Desktop: dropdown popper.
 * Mobile: bottom sheet estilo Android (lista full-width na base da tela).
 */
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(
  (
    {
      className,
      children,
      position = 'popper',
      side,
      align,
      sideOffset,
      avoidCollisions,
      ...props
    },
    ref,
  ) => {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  // Radix aplica top/left/transform inline — no mobile forçamos sheet na base.
  React.useLayoutEffect(() => {
    if (!isMobile) return;
    const el = contentRef.current;
    if (!el) return;

    const pinToBottom = () => {
      el.style.setProperty('position', 'fixed', 'important');
      el.style.setProperty('top', 'auto', 'important');
      el.style.setProperty('bottom', '0px', 'important');
      el.style.setProperty('left', '0px', 'important');
      el.style.setProperty('right', '0px', 'important');
      el.style.setProperty('transform', 'none', 'important');
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('max-width', '100vw', 'important');
      el.style.setProperty('min-width', '100%', 'important');
      el.style.setProperty('max-height', 'min(75dvh, 32rem)', 'important');
    };

    pinToBottom();
    const observer = new MutationObserver(pinToBottom);
    observer.observe(el, {
      attributes: true,
      attributeFilter: ['style'],
    });
    return () => observer.disconnect();
  }, [isMobile]);

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={setRefs}
        className={cn(
          'relative z-[51] min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
          'max-h-[min(24rem,70vh)]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          !isMobile &&
            position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          // Mobile sheet visual
          isMobile &&
            'rounded-t-2xl rounded-b-none border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.18)] data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:zoom-in-100',
          className,
        )}
        position={position}
        side={isMobile ? 'bottom' : side}
        align={isMobile ? 'center' : align}
        avoidCollisions={isMobile ? false : avoidCollisions}
        sideOffset={isMobile ? 0 : sideOffset}
        {...props}
      >
        {isMobile ? (
          <div className="flex justify-center pb-1 pt-3" aria-hidden>
            <div className="h-1 w-10 rounded-full bg-muted-foreground/35" />
          </div>
        ) : null}
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1 overflow-y-auto overscroll-contain',
            'max-h-[min(22rem,66vh)]',
            isMobile &&
              '!h-auto max-h-[min(65dvh,28rem)] w-full min-w-full p-2',
            !isMobile &&
              position === 'popper' &&
              'w-full min-w-[var(--radix-select-trigger-width)]',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
},
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'max-md:min-h-12 max-md:rounded-md max-md:py-3.5',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
