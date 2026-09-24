"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CalBookingDialog.module.css";

const CAL_URL = "https://cal.com/moiz-kinetiq/30min";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CalBookingDialog({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [calendarLoaded, setCalendarLoaded] = useState(false);

  const closeDialog = () => {
    setCalendarLoaded(false);
    onClose();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      id="cal-booking-dialog"
      className={styles.dialog}
      aria-labelledby="cal-booking-title"
      onClose={closeDialog}
      onCancel={closeDialog}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Schedule a conversation</p>
            <h2 id="cal-booking-title" className={styles.title}>Book a 30-minute call</h2>
          </div>
          <button type="button" className={styles.close} onClick={closeDialog} aria-label="Close booking dialog">
            <span aria-hidden="true">&times;</span>
          </button>
        </header>

        <div className={styles.calendar}>
          <div
            className={`${styles.loader} ${calendarLoaded ? styles.loaderHidden : ""}`}
            role="status"
            aria-live="polite"
          >
            <span className={styles.spinner} aria-hidden="true" />
            <span>Loading available times...</span>
          </div>

          {open && (
            <iframe
              className={`${styles.frame} ${calendarLoaded ? styles.frameLoaded : ""}`}
              src={`${CAL_URL}?embed=true&theme=dark`}
              title="Book a 30-minute call with Abdul Moiz"
              allow="payment"
              onLoad={() => setCalendarLoaded(true)}
            />
          )}
        </div>

        <p className={styles.fallback}>
          Having trouble with the calendar?{" "}
          <a href={CAL_URL} target="_blank" rel="noreferrer">
            Open Cal.com in a new tab
          </a>
        </p>
      </div>
    </dialog>
  );
}

export default CalBookingDialog;
