"use client";

import { PanelLeft } from "lucide-react";
import {
  Children,
  type ComponentProps,
  cloneElement,
  createContext,
  isValidElement,
  type ReactElement,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMediaQuery } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet";

const SIDEBAR_WIDTH_COLLAPSED = 72;
const SIDEBAR_WIDTH_EXPANDED = 256;
const SIDEBAR_WIDTH_MIN = 72;
const SIDEBAR_WIDTH_MAX = 480;
const SIDEBAR_STORAGE_KEY = "swantara:sidebar:width";

type SidebarState = "expanded" | "collapsed";

type SidebarContextValue = {
  state: SidebarState;
  width: number;
  setWidth: (w: number) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  isResizing: boolean;
  setIsResizing: (resizing: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within <SidebarProvider>.");
  }
  return context;
}

function clampWidth(w: number): number {
  return Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, w));
}

function readStoredWidth(fallback: number): number {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? clampWidth(n) : fallback;
  } catch {
    return fallback;
  }
}

function persistWidth(width: number) {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(width));
  } catch {
    return;
  }
}

function SidebarProvider({
  defaultCollapsed = false,
  defaultWidth,
  className,
  children,
  ...props
}: ComponentProps<"div"> & {
  defaultCollapsed?: boolean;
  defaultWidth?: number;
}) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [width, setWidthState] = useState(() => {
    if (defaultWidth != null) return clampWidth(defaultWidth);
    const fallback = defaultCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
    return readStoredWidth(fallback);
  });
  const [openMobile, setOpenMobile] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const collapsed = width <= SIDEBAR_WIDTH_COLLAPSED;

  useEffect(() => {
    if (!isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile]);

  const setWidth = useCallback((w: number) => {
    setWidthState(clampWidth(w));
  }, []);

  useEffect(() => {
    if (!isResizing) {
      persistWidth(width);
    }
  }, [width, isResizing]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }
    const { body } = document;
    const previousCursor = body.style.cursor;
    const previousUserSelect = body.style.userSelect;
    body.style.cursor = "col-resize";
    body.style.userSelect = "none";
    return () => {
      body.style.cursor = previousCursor;
      body.style.userSelect = previousUserSelect;
    };
  }, [isResizing]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile((open) => !open);
      return;
    }
    setWidthState((current) =>
      current <= SIDEBAR_WIDTH_COLLAPSED ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
    );
  }, [isMobile]);

  const value = useMemo<SidebarContextValue>(
    () => ({
      state: collapsed ? "collapsed" : "expanded",
      width,
      setWidth,
      openMobile,
      setOpenMobile,
      isMobile,
      isResizing,
      setIsResizing,
      toggleSidebar,
    }),
    [collapsed, width, setWidth, openMobile, isMobile, isResizing, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-provider"
        className={cn("flex min-h-svh w-full", className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  className,
  children,
  resizeLabel,
  sidebarTitle,
  ...props
}: ComponentProps<"aside"> & {
  resizeLabel?: string;
  sidebarTitle?: string;
}) {
  const { isMobile, state, width, openMobile, setOpenMobile, isResizing } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" showCloseButton={false} className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{sidebarTitle ?? "Sidebar"}</SheetTitle>
          </SheetHeader>
          <div
            data-slot="sidebar"
            data-state={state}
            className={cn(
              "flex h-full flex-col gap-0 bg-sidebar text-sidebar-foreground",
              className,
            )}
            {...(props as ComponentProps<"div">)}
          >
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      data-slot="sidebar"
      data-state={state}
      data-resizing={isResizing}
      className={cn(
        "sticky top-0 z-docked flex h-dvh shrink-0 flex-col gap-0 border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out data-[resizing=true]:transition-none",
        className,
      )}
      style={{ width }}
      {...props}
    >
      {children}
      <SidebarResizeHandle label={resizeLabel ?? "Resize sidebar"} />
    </aside>
  );
}

const SIDEBAR_RESIZE_STEP = 16;

function getResizeDirection(element: HTMLElement): number {
  return getComputedStyle(element).direction === "rtl" ? -1 : 1;
}

function SidebarResizeHandle({ label }: { label: string }) {
  const { width, setWidth, isResizing, setIsResizing, toggleSidebar } = useSidebar();
  const startX = useRef(0);
  const startWidth = useRef(width);
  const direction = useRef(1);
  const dragging = useRef(false);

  const stopResizing = useCallback(
    (target?: HTMLElement, pointerId?: number) => {
      dragging.current = false;
      setIsResizing(false);
      (target ?? document.querySelector("[data-slot='sidebar-resize-handle']"))
        ?.closest("[data-slot='sidebar']")
        ?.setAttribute("data-resizing", "false");
      if (target && pointerId != null && target.hasPointerCapture?.(pointerId)) {
        target.releasePointerCapture(pointerId);
      }
    },
    [setIsResizing],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLHRElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    dragging.current = true;
    direction.current = getResizeDirection(event.currentTarget);
    startX.current = event.clientX;
    startWidth.current = width;
    setIsResizing(true);
    event.currentTarget.closest("[data-slot='sidebar']")?.setAttribute("data-resizing", "true");
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLHRElement>) => {
    if (!dragging.current) return;
    event.preventDefault();
    const delta = (event.clientX - startX.current) * direction.current;
    setWidth(startWidth.current + delta);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLHRElement>) => {
    if (!dragging.current) return;
    stopResizing(event.currentTarget, event.pointerId);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLHRElement>) => {
    const step = event.shiftKey ? SIDEBAR_RESIZE_STEP * 2 : SIDEBAR_RESIZE_STEP;
    const dir = getResizeDirection(event.currentTarget);
    let next: number | null = null;

    switch (event.key) {
      case "ArrowLeft":
        next = width - step * dir;
        break;
      case "ArrowRight":
        next = width + step * dir;
        break;
      case "Home":
        next = SIDEBAR_WIDTH_MIN;
        break;
      case "End":
        next = SIDEBAR_WIDTH_MAX;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        toggleSidebar();
        return;
      default:
        return;
    }

    event.preventDefault();
    setWidth(next);
  };

  return (
    <hr
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={width}
      aria-valuemin={SIDEBAR_WIDTH_MIN}
      aria-valuemax={SIDEBAR_WIDTH_MAX}
      tabIndex={0}
      data-slot="sidebar-resize-handle"
      data-resizing={isResizing}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={() => stopResizing()}
      onDoubleClick={toggleSidebar}
      onKeyDown={handleKeyDown}
      className={cn(
        "absolute inset-y-0 -end-1.5 z-raised m-0 flex w-3 cursor-col-resize touch-none items-center justify-center border-0 select-none outline-none",
        "after:absolute after:inset-y-0 after:end-1.5 after:w-px after:bg-transparent after:transition-colors",
        "hover:after:bg-sidebar-ring/60 focus-visible:after:bg-sidebar-ring",
        "data-[resizing=true]:after:bg-sidebar-ring",
      )}
    />
  );
}

function SidebarHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex shrink-0 flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn("flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 py-4", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("flex shrink-0 flex-col gap-1 border-t border-sidebar-border p-2", className)}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="sidebar-group" className={cn("flex flex-col gap-1", className)} {...props} />
  );
}

function SidebarGroupLabel({ className, ...props }: ComponentProps<"div">) {
  const { state } = useSidebar();
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        "px-2.5 py-1.5 text-xs font-normal tracking-wide text-muted-foreground",
        state === "collapsed" && "sr-only",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul data-slot="sidebar-menu" className={cn("flex flex-col gap-1", className)} {...props} />
  );
}

function SidebarMenuItem({
  className,
  ref,
  ...props
}: ComponentProps<"li"> & { ref?: Ref<HTMLLIElement> }) {
  return (
    <li data-slot="sidebar-menu-item" ref={ref} className={cn("list-none", className)} {...props} />
  );
}

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  className,
  label,
  children,
  ...props
}: ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  label?: ReactNode;
}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const classes = cn(
    "relative flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-normal text-sidebar-foreground/75 outline-none transition-colors",
    "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
    "focus-visible:ring-3 focus-visible:ring-sidebar-ring/50",
    "data-[active=true]:bg-sidebar-primary/10 data-[active=true]:text-sidebar-primary",
    "data-[active=true]:before:absolute data-[active=true]:before:inset-y-2.5 data-[active=true]:before:start-0.5 data-[active=true]:before:w-0.5 data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary",
    "[&>svg]:size-[18px] [&>svg]:shrink-0",
    collapsed && "size-11 justify-center px-0",
    className,
  );

  if (asChild && Children.count(children) === 1 && isValidElement(children)) {
    const child = Children.only(children) as ReactElement<{
      className?: string;
    }>;
    return cloneElement(child, {
      "data-slot": "sidebar-menu-button",
      "data-active": isActive,
      className: cn(classes, collapsed && "[&>span]:sr-only", child.props.className),
      ...(collapsed && typeof label === "string" ? { "aria-label": label } : {}),
      ...(typeof label === "string" ? { title: label } : {}),
      ...(props as Record<string, unknown>),
    } as React.HTMLAttributes<HTMLElement> & Record<string, unknown>);
  }

  return (
    <button
      type="button"
      data-slot="sidebar-menu-button"
      data-active={isActive}
      aria-label={collapsed && typeof label === "string" ? label : undefined}
      title={typeof label === "string" ? label : undefined}
      className={classes}
      {...props}
    >
      {children}
      {label ? <span className={cn("truncate", collapsed && "sr-only")}>{label}</span> : null}
    </button>
  );
}

function SidebarMenuAction({
  className,
  ...props
}: ComponentProps<"button"> & { showOnHover?: boolean }) {
  const { state } = useSidebar();
  if (state === "collapsed") return null;
  return (
    <button
      type="button"
      data-slot="sidebar-menu-action"
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/60 outline-none transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:ring-3 focus-visible:ring-sidebar-ring/50",
        "[[data-panel-open]>&]:bg-sidebar-accent [[data-panel-open]>&]:text-sidebar-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SidebarTrigger({
  className,
  label,
  ...props
}: ComponentProps<typeof Button> & { label?: string }) {
  const { toggleSidebar, state, openMobile, isMobile } = useSidebar();
  return (
    <Button
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      aria-label={label ?? "Toggle sidebar"}
      aria-expanded={isMobile ? openMobile : state === "expanded"}
      aria-controls="app-sidebar"
      onClick={toggleSidebar}
      className={className}
      {...props}
    >
      <PanelLeft />
    </Button>
  );
}

function SidebarDivider({ className, ...props }: ComponentProps<"hr">) {
  return (
    <hr
      data-slot="sidebar-divider"
      className={cn("mx-2 my-2 h-px shrink-0 border-0 bg-sidebar-border", className)}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-inset"
      className={cn("flex min-h-svh min-w-0 flex-1 flex-col", className)}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarDivider,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};

export type AppShellLabels = {
  toggleSidebar?: string;
  resizeSidebar?: string;
  sidebarTitle?: string;
};

export type AppShellProps = {
  brand?: ReactNode;
  nav: ReactNode;
  footer?: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
  labels?: AppShellLabels;
  defaultCollapsed?: boolean;
  className?: string;
  children: ReactNode;
};

export function AppShell({
  brand,
  nav,
  footer,
  search,
  actions,
  labels,
  defaultCollapsed = false,
  className,
  children,
}: AppShellProps) {
  return (
    <SidebarProvider data-slot="app-shell" defaultCollapsed={defaultCollapsed}>
      <Sidebar
        id="app-sidebar"
        resizeLabel={labels?.resizeSidebar}
        sidebarTitle={labels?.sidebarTitle}
        className="sticky top-0 bottom-0"
      >
        {brand ? (
          <SidebarHeader className="border-sidebar-border/70 px-3">
            {brand}
          </SidebarHeader>
        ) : null}
        <SidebarContent>{nav}</SidebarContent>
        {footer ? <SidebarFooter>{footer}</SidebarFooter> : null}
      </Sidebar>
      <SidebarInset className="bg-surface-sunken">
        <header className="sticky top-0 z-header flex shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl h-16 sm:px-6">
          <SidebarTrigger label={labels?.toggleSidebar} />
          {search ? (
            <div className="flex min-w-0 flex-1 justify-start">{search}</div>
          ) : (
            <div className="flex-1" />
          )}
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
        <main
          id="main"
          className={cn(
            "mx-auto flex w-full max-w-screen-2xl flex-1 flex-col p-4 sm:p-6 lg:p-8",
            className,
          )}
        >
          <div className="flex flex-1 flex-col gap-6">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
