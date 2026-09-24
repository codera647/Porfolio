import { readFile } from "node:fs/promises";
import path from "node:path";
import IntroStage from "@/components/intro/IntroStage";
import Philosophy from "@/components/philosophy/Philosophy";
import Shipping from "@/components/shipping/Shipping";

/**
 * The animated signature is inlined rather than linked.
 *
 * The brief is firm that a slow or failed asset request must never trap anyone
 * behind the intro (s5.6). Inlining removes the request altogether: the mark is
 * in the HTML, so there is nothing left to fail. It costs about 25KB gzipped,
 * which is worth it for the one thing on the critical path. The static mark the
 * nav uses is still a normal request, because its alt text is a complete
 * fallback if it ever does not arrive.
 *
 * Read at build time; this page is statically generated.
 */
async function readSignature() {
  const file = path.join(
    process.cwd(),
    "public",
    "signature",
    "abdul-moiz-signature-animated.svg",
  );
  return readFile(file, "utf8");
}

export default async function Home() {
  const signature = await readSignature();
  return (
    <main>
      <IntroStage signature={signature} />
      <Philosophy />
      <Shipping />
    </main>
  );
}
