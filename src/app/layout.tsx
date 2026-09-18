import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { INTRO_GATE_SCRIPT } from "@/lib/introGate";
import "./globals.css";

/* One typeface for the whole site (s5.4). No weight list: this pulls the
   variable font, whose weight axis the name's pointer response needs to drive
   continuously between 250 and 800. The handwritten signature is brand artwork,
   never a heading font. */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Abdul Moiz",
  description: "Machine Learning Engineer / Architect. Ideas, built with intention.",
};

export const viewport: Viewport = {
  themeColor: "#0C0C0C",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    /*
     * suppressHydrationWarning is here for the gate script in @/lib/introGate,
     * which is the whole point of it: it stamps data-intro-played before
     * React hydrates, so the server HTML and the client DOM legitimately differ.
     * Without this React reports a mismatch and may drop the attribute, which
     * would let the intro layer paint for a frame on a repeat visit - exactly
     * the flash the script exists to prevent.
     *
     * It applies only to this element's own attributes and text, never to
     * descendants, so it cannot hide a real mismatch anywhere else in the tree.
     */
    <html
      lang="en"
      className={jetbrainsMono.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
