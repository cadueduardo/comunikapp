'use client';

/**
 * Select responsivo:
 * - Desktop: Radix Select puro (sem estado espelho) — evita Maximum update depth.
 * - Mobile: bottom sheet próprio via createPortal no `document.body`
 *   (lista de botões — NÃO aninha Select.Content em Dialog; Radix #2571).
 *
 * Importante: o sheet e as barras fixas do app devem viver no `body`,
 * fora do container `overflow-y-auto` do layout — senão o Chrome mobile
 * desalinha visual ↔ hit-target após scroll.
 */

import * as React from 'react';
import { createPortal } from 'react-dom';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';

import { cn } from '@/lib/utils';

const MOBILE_QUERY = '(max-width: 767px)';

type SelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

type SelectUiContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  setOptions: React.Dispatch<React.SetStateAction<SelectOption[]>>;
  placeholder?: string;
  setPlaceholder: (placeholder?: string) => void;
};

const SelectUiContext = React.createContext<SelectUiContextValue | null>(null);

/** Noop no desktop: Trigger/Value/Content ainda chamam o hook, sem setState. */
const DESKTOP_SELECT_UI: SelectUiContextValue = {
  open: false,
  onOpenChange: () => {},
  value: undefined,
  onValueChange: undefined,
  options: [],
  setOptions: () => {},
  placeholder: undefined,
  setPlaceholder: () => {},
};

function useSelectUi() {
  const ctx = React.useContext(SelectUiContext);
  if (!ctx) {
    throw new Error('Select.* deve ser usado dentro de <Select>');
  }
  return ctx;
}

function subscribeMobile(onStoreChange: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getMobileServerSnapshot() {
  return false;
}

function useIsMobileSelect() {
  return React.useSyncExternalStore(
    subscribeMobile,
    getMobileSnapshot,
    getMobileServerSnapshot,
  );
}

function getElementName(type: unknown): string {
  if (typeof type === 'string') return type;
  if (typeof type === 'function' || (typeof type === 'object' && type)) {
    const t = type as { displayName?: string; name?: string };
    return t.displayName || t.name || '';
  }
  return '';
}

function partitionSelectChildren(children: React.ReactNode): {
  options: SelectOption[];
  extras: React.ReactNode[];
} {
  const options: SelectOption[] = [];
  const extras: React.ReactNode[] = [];

  const walk = (node: React.ReactNode) => {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return;

      const name = getElementName(child.type);
      const props = child.props as {
        value?: string;
        children?: React.ReactNode;
        disabled?: boolean;
      };

      if (name === 'SelectItem') {
        if (props.value != null && props.value !== '') {
          options.push({
            value: String(props.value),
            label: props.children,
            disabled: Boolean(props.disabled),
          });
        }
        return;
      }

      if (name === 'SelectGroup') {
        walk(props.children);
        return;
      }

      if (name === 'SelectLabel' || name === 'SelectSeparator') {
        return;
      }

      if (child.type === React.Fragment) {
        walk(props.children);
        return;
      }

      extras.push(child);
    });
  };

  walk(children);
  return { options, extras };
}

function lockAppScroll() {
  const root = document.querySelector<HTMLElement>('[data-app-scroll-root]');
  if (!root) return () => {};
  const previous = root.style.overflow;
  root.style.overflow = 'hidden';
  return () => {
    root.style.overflow = previous;
  };
}

function MobileSelectSheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    return lockAppScroll();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="pointer-events-auto fixed inset-0 z-[200] touch-manipulation"
      role="presentation"
      data-mobile-select-sheet-root=""
      style={{ transform: 'translateZ(0)' }}
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Selecionar"
        className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] min-h-[45dvh] flex-col rounded-t-2xl border border-b-0 bg-background shadow-[0_-8px_30px_rgba(0,0,0,0.18)]"
      >
        <div className="relative flex shrink-0 items-center justify-center border-b px-4 pb-3 pt-3">
          <div
            className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-muted-foreground/35"
            aria-hidden
          />
          <p className="pt-2 text-base font-semibold">Selecionar</p>
          <button
            type="button"
            aria-label="Fechar"
            className="absolute right-3 top-3 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

type SelectProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>;

function sanitizeSelectValue(
  value: SelectProps['value'],
): string | undefined {
  if (value == null || value === '') return undefined;
  return String(value);
}

function Select({
  open: openProp,
  defaultOpen,
  onOpenChange,
  value: valueProp,
  defaultValue,
  onValueChange,
  ...props
}: SelectProps) {
  const isMobile = useIsMobileSelect();

  // Hooks sempre montados (Rules of Hooks) — só usados no caminho mobile.
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false,
  );
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    sanitizeSelectValue(defaultValue),
  );
  const [options, setOptions] = React.useState<SelectOption[]>([]);
  const [placeholder, setPlaceholder] = React.useState<string | undefined>();

  const isOpenControlled = openProp !== undefined;
  const isValueControlled = valueProp !== undefined;
  const open = isOpenControlled ? Boolean(openProp) : uncontrolledOpen;
  const value = isValueControlled
    ? sanitizeSelectValue(valueProp)
    : uncontrolledValue;

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isOpenControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isOpenControlled, onOpenChange],
  );

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (!next) return;
      if (!isValueControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    },
    [isValueControlled, onValueChange],
  );

  const mobileUi = React.useMemo(
    () => ({
      open,
      onOpenChange: handleOpenChange,
      value,
      onValueChange: handleValueChange,
      options,
      setOptions,
      placeholder,
      setPlaceholder,
    }),
    [open, handleOpenChange, value, handleValueChange, options, placeholder],
  );

  // Desktop: Radix puro — sem espelhar open/value/options (evita update depth).
  if (!isMobile) {
    const safeValue = sanitizeSelectValue(valueProp);
    return (
      <SelectUiContext.Provider value={DESKTOP_SELECT_UI}>
        <SelectPrimitive.Root
          defaultOpen={defaultOpen}
          open={openProp}
          onOpenChange={onOpenChange}
          defaultValue={
            defaultValue != null && defaultValue !== ''
              ? String(defaultValue)
              : undefined
          }
          {...(safeValue !== undefined ? { value: safeValue } : {})}
          onValueChange={onValueChange}
          {...props}
        />
      </SelectUiContext.Provider>
    );
  }

  // Mobile: sheet próprio (Radix Root NÃO montado).
  return (
    <SelectUiContext.Provider value={mobileUi}>
      {props.children}
    </SelectUiContext.Provider>
  );
}

const SelectGroup = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group>
>((props, ref) => <SelectPrimitive.Group ref={ref} {...props} />);
SelectGroup.displayName = 'SelectGroup';

const SelectValue = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Value>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>(({ placeholder, className, ...props }, ref) => {
  const isMobile = useIsMobileSelect();
  const { value, options, setPlaceholder } = useSelectUi();

  React.useEffect(() => {
    if (!isMobile) return;
    setPlaceholder(typeof placeholder === 'string' ? placeholder : undefined);
  }, [isMobile, placeholder, setPlaceholder]);

  if (isMobile) {
    const selected = options.find((opt) => opt.value === value);
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        className={cn(
          'line-clamp-1',
          !selected && 'text-muted-foreground',
          className,
        )}
      >
        {selected ? selected.label : placeholder}
      </span>
    );
  }

  return (
    <SelectPrimitive.Value
      ref={ref}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
});
SelectValue.displayName = 'SelectValue';

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const isMobile = useIsMobileSelect();
  const { open, onOpenChange } = useSelectUi();

  const triggerClassName = cn(
    'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
    className,
  );

  if (isMobile) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={triggerClassName}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={props.disabled}
        onClick={() => onOpenChange(true)}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    );
  }

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={triggerClassName}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      'flex cursor-pointer items-center justify-center py-1',
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
      'flex cursor-pointer items-center justify-center py-1',
      className,
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

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
    const isMobile = useIsMobileSelect();
    const {
      open,
      onOpenChange,
      value,
      onValueChange,
      setOptions,
    } = useSelectUi();

    const { options, extras } = React.useMemo(
      () => (isMobile ? partitionSelectChildren(children) : { options: [], extras: [] }),
      [children, isMobile],
    );

    React.useLayoutEffect(() => {
      if (!isMobile) return;
      setOptions((prev) => {
        if (
          prev.length === options.length &&
          prev.every(
            (item, index) =>
              item.value === options[index]?.value &&
              item.disabled === options[index]?.disabled,
          )
        ) {
          return prev;
        }
        return options;
      });
    }, [isMobile, options, setOptions]);

    if (isMobile) {
      return (
        <MobileSelectSheet open={open} onOpenChange={onOpenChange}>
          <ul className="flex flex-col gap-0.5" role="listbox">
            {options.map((opt) => {
              const selected = opt.value === value;
              return (
                <li key={opt.value} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={opt.disabled}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-md px-3 py-3.5 text-left text-sm transition-colors',
                      'hover:bg-accent hover:text-accent-foreground active:bg-accent',
                      'disabled:pointer-events-none disabled:opacity-50',
                      selected && 'bg-accent text-accent-foreground',
                    )}
                    onClick={() => {
                      if (opt.disabled) return;
                      onValueChange?.(opt.value);
                      onOpenChange(false);
                    }}
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                      {selected ? <Check className="h-4 w-4" /> : null}
                    </span>
                    <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
                      {opt.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {extras.length > 0 ? (
            <div
              className="mt-2 border-t pt-2"
              onClickCapture={() => {
                window.setTimeout(() => onOpenChange(false), 0);
              }}
            >
              {extras}
            </div>
          ) : null}
        </MobileSelectSheet>
      );
    }

    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={ref}
          className={cn(
            'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            position === 'popper' &&
              'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
            className,
          )}
          position={position}
          side={side}
          align={align}
          sideOffset={sideOffset}
          avoidCollisions={avoidCollisions}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.Viewport
            className={cn(
              'p-1',
              position === 'popper' &&
                'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
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
SelectContent.displayName = 'SelectContent';

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
SelectLabel.displayName = 'SelectLabel';

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
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
SelectItem.displayName = 'SelectItem';

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
SelectSeparator.displayName = 'SelectSeparator';

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
