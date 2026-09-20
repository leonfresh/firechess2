"use client";
import { useEffect, useRef, type MouseEvent } from "react";

let locks = 0;
let previousOverflow = "";

/** Native dialogs provide focus trapping and Escape; keep React state and scroll in sync. */
export function useActivityDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const trigger = document.activeElement as HTMLElement | null;
    if (locks++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    dialog.showModal();
    dialog.scrollTop = 0;
    const closed = () => close.current();
    dialog.addEventListener("close", closed);
    return () => {
      dialog.removeEventListener("close", closed);
      dialog.close();
      if (--locks === 0) document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open]);
  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close.current();
  };
  return { ref, onBackdropClick };
}
