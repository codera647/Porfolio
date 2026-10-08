"use client";

import { useEffect } from "react";

/** Progressive enhancement only: all text remains SSR'd, searchable and printable. */
export default function DocumentEnhancements({ documentId }: { documentId: string }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-project-document]");
    if (!root) return;
    const sections = [...root.querySelectorAll<HTMLElement>("[data-doc-section]")];
    const items = [...root.querySelectorAll<HTMLAnchorElement>("[data-doc-toc] a")];
    const progress = root.querySelector<HTMLElement>("[data-reading-progress]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reveals = [...root.querySelectorAll<HTMLElement>("[data-doc-reveal]")];
    let frame: number | null = null;
    let activeId = "frontispiece";
    const showAll = () => reveals.forEach((node) => { delete node.dataset.revealPending; });
    const observer: IntersectionObserver | null = !reduced.matches && "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          delete (entry.target as HTMLElement).dataset.revealPending;
          observer?.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -5% 0px", threshold: 0 }) : null;
    if (observer) {
      reveals.forEach((node) => {
        if (node.getBoundingClientRect().top > window.innerHeight) {
          node.dataset.revealPending = "";
          observer.observe(node);
        }
      });
    }
    root.dataset.enhanced = "";

    const update = () => {
      frame = null;
      const distance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const fraction = Math.min(1, Math.max(0, window.scrollY / distance));
      progress?.style.setProperty("--reading-progress", String(fraction));
      progress?.setAttribute("aria-valuenow", String(Math.round(fraction * 100)));
      let current = "frontispiece";
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= 160) current = section.id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = sections.at(-1)?.id ?? current;
      if (current === activeId && items.some((item) => item.hasAttribute("aria-current"))) return;
      activeId = current;
      items.forEach((item) => {
        if (item.hash === `#${current}`) item.setAttribute("aria-current", "location");
        else item.removeAttribute("aria-current");
      });
      const active = items.find((item) => item.hash === `#${current}` && item.closest("[data-desktop-toc]"));
      const panel = active?.closest<HTMLElement>("[data-desktop-toc]");
      if (active && panel) {
        const itemRect = active.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        if (itemRect.bottom > panelRect.bottom - 25) panel.scrollTop += itemRect.bottom - panelRect.bottom + 40;
        if (itemRect.top < panelRect.top + 25) panel.scrollTop += itemRect.top - panelRect.top - 40;
      }
    };
    const requestUpdate = () => { if (frame === null) frame = requestAnimationFrame(update); };
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("[data-doc-toc] a");
      if (!link) return;
      const id = link.hash.slice(1);
      const section = document.getElementById(id);
      section?.querySelectorAll<HTMLElement>("[data-doc-reveal]").forEach((node) => { delete node.dataset.revealPending; });
      const mobile = link.closest("details");
      if (mobile) mobile.open = false;
    };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element) {
        const pending = event.target.closest<HTMLElement>("[data-reveal-pending]");
        if (pending) delete pending.dataset.revealPending;
      }
    };
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    window.addEventListener("beforeprint", showAll);
    reduced.addEventListener("change", showAll);
    root.addEventListener("click", onClick);
    root.addEventListener("focusin", onFocus);
    update();
    return () => {
      observer?.disconnect();
      showAll();
      delete root.dataset.enhanced;
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("beforeprint", showAll);
      reduced.removeEventListener("change", showAll);
      root.removeEventListener("click", onClick);
      root.removeEventListener("focusin", onFocus);
    };
  }, [documentId]);
  return null;
}
