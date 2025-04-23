
import * as React from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@radix-ui/react-toast"

import { cn } from "@/lib/utils"

const ToastDemo = () => {
  return (
    <ToastProvider>
      <Toast>
        <ToastTitle>Heads up!</ToastTitle>
        <ToastDescription>
          This is important information that needs your attention.
        </ToastDescription>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  )
}

/**
 * Patch: fix the z-index so toast appears above modals/dialogs.
 * - z-[99999] is higher than dialog's z-[200] and other elements.
 */
export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport className="fixed top-0 left-1/2 z-[99999] flex max-h-screen w-full max-w-md -translate-x-1/2 flex-col p-4 sm:top-4 sm:right-4 sm:left-auto sm:translate-x-0" />
    </ToastProvider>
  )
}
