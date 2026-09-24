"use client";

import { useState } from "react";
import BracketButton from "./BracketButton";
import CalBookingDialog from "./CalBookingDialog";
import styles from "./HeroNav.module.css";

/**
 * Signature upper left, a single "Let's talk" upper right.
 *
 * The Work / About / Contact row and the mobile Menu panel were both removed at
 * Nex's request. Nothing else in the hero now points at the lower sections, so
 * when those get built (section 5.11) they will need their own way in.
 */
export function HeroNav() {
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
      <nav className={styles.nav} aria-label="Primary">
        <a className={styles.mark} href="#top" aria-label="Abdul Moiz, home">
          {/* The static mark, not the animated one. A failed request here leaves
              the alt text, which is a complete fallback; the intro's signature is
              inlined precisely because it cannot afford that. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/signature/abdul-moiz-signature-light.svg"
            alt="Abdul Moiz"
            width={120}
            height={64}
          />
        </a>

        <BracketButton
          onClick={() => setBookingOpen(true)}
          controls="cal-booking-dialog"
        >
          Let&rsquo;s talk
        </BracketButton>
      </nav>

      <CalBookingDialog open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </>
  );
}

export default HeroNav;
