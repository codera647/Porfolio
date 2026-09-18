"use client";

import { useCallback, useState } from "react";
import Hero from "@/components/hero/Hero";
import Intro from "./Intro";

type Props = {
  /** The animated signature markup, inlined by the server component. */
  signature: string;
};

/**
 * Holds the handover between the intro and the hero. The intro decides whether
 * it should play at all (once per browsing session) and reports back; the hero
 * either runs the full entrance choreography or renders already settled.
 */
export function IntroStage({ signature }: Props) {
  const [handover, setHandover] = useState<{ started: boolean; immediate: boolean }>({
    started: false,
    immediate: false,
  });

  const onFinish = useCallback((immediate: boolean) => {
    setHandover({ started: true, immediate });
  }, []);

  return (
    <>
      <Intro markup={signature} onFinish={onFinish} />
      <Hero started={handover.started} immediate={handover.immediate} />
    </>
  );
}

export default IntroStage;
