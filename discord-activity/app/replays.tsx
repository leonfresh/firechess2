"use client";
import { useEffect, useRef, useState } from "react";
import { ChaosWatch } from "@/components/chaos-watch";
import { ChaosHubIcon } from "@/components/chaos-hub-icon";
import styles from "@/components/chaos-watch.module.css";

/**
 * Replays belong to the lobby: the archive list and the replay board come back as a modal, so a
 * player can rewatch the game they just lost without leaving the room. Live spectating stays on its
 * own page (/watch) — the watchtower component itself still never opens a dialog of its own.
 */
export function ActivityReplays({ card = false }: { card?: boolean }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return (
    <>
      <button
        className={card ? "lobby-destination" : "sound-button"}
        data-tone="sky"
        onClick={() => setOpen(true)}
      >
        {card ? (
          <>
            <span className="destination-icon">
              <ChaosHubIcon kind="replay" />
            </span>
            <strong>Replays</strong>
            <small>Rewatch finished games</small>
            <span className="destination-arrow" aria-hidden="true">
              ↗
            </span>
          </>
        ) : (
          "Replays"
        )}
      </button>
      <dialog
        className={styles.dialog}
        ref={dialog}
        onCancel={() => setOpen(false)}
        aria-label="Replays"
      >
        {open && (
          <ChaosWatch initialTab="archive" onClose={() => setOpen(false)} />
        )}
      </dialog>
    </>
  );
}
