"use client"

import type * as React from "react"
import {
  Dialog as DialogPrimitive,
  Heading as HeadingPrimitive,
  Modal as ModalPrimitive,
  ModalOverlay as ModalOverlayPrimitive,
  type DialogProps as DialogPrimitiveProps,
  type HeadingProps as HeadingPrimitiveProps,
  type ModalOverlayProps,
} from "react-aria-components"

import { cn } from "@/lib/utils"

/**
 * Modal dialog built on react-aria-components — the same primitive layer the
 * buttons use. It handles the focus trap, Escape, scroll lock and the
 * aria-labelledby wiring; everything below is just the skin.
 */
function Dialog({
  className,
  overlayClassName,
  children,
  ...props
}: ModalOverlayProps & {
  className?: string
  overlayClassName?: string
  children?: React.ReactNode
}) {
  return (
    <ModalOverlayPrimitive
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-110 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6",
        "data-[entering]:animate-in data-[entering]:fade-in-0",
        "data-[exiting]:animate-out data-[exiting]:fade-out-0",
        overlayClassName
      )}
      {...props}
    >
      <ModalPrimitive
        data-slot="dialog"
        className={cn(
          "flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-xl border bg-background shadow-lg sm:max-h-[85dvh] sm:max-w-lg sm:rounded-xl",
          "data-[entering]:animate-in data-[entering]:fade-in-0 data-[entering]:slide-in-from-bottom-4 data-[entering]:sm:zoom-in-95 data-[entering]:sm:slide-in-from-bottom-0",
          "data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[exiting]:sm:zoom-out-95",
          className
        )}
      >
        {children}
      </ModalPrimitive>
    </ModalOverlayPrimitive>
  )
}

/** The focus-trapped content region. Needs a DialogTitle to be labelled. */
function DialogContent({
  className,
  ...props
}: DialogPrimitiveProps & { className?: string }) {
  return (
    <DialogPrimitive
      data-slot="dialog-content"
      className={cn("flex min-h-0 flex-col outline-none", className)}
      {...props}
    />
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 border-b px-5 py-4", className)}
      {...props}
    />
  )
}

/** Renders the accessible name — react-aria reads it via slot="title". */
function DialogTitle({
  className,
  ...props
}: HeadingPrimitiveProps & { className?: string }) {
  return (
    <HeadingPrimitive
      slot="title"
      data-slot="dialog-title"
      className={cn("text-base font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="dialog-description"
      className={cn("text-[13px] text-muted-foreground", className)}
      {...props}
    />
  )
}

/** Scrolls on its own so the header and footer stay pinned. */
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
}
