/**
 * Whether the intro should play, decided in two places that must agree.
 *
 * The brief is that it plays once per browsing session (s5.6), which
 * `sessionStorage` gives us. That is correct for visitors and miserable for
 * anyone building the thing: sessionStorage survives reloads in the same tab,
 * so after the first load the intro never shows again without opening a new tab.
 * `?intro` overrides it, `?intro=0` forces it off. It is a reviewing switch, not
 * a change to the shipped behaviour - nobody reaches it by accident.
 *
 * The decision is needed twice: once before first paint, as a plain string of
 * JavaScript in the document head (React cannot help that early - the black
 * layer would paint and then vanish), and once in the Intro component after
 * hydration. The two implementations below are deliberately adjacent so they
 * cannot drift apart. Change one, change the other.
 */

export const INTRO_SESSION_KEY = "am-intro-played";

/**
 * In development the intro plays on every load. Once per session is correct for
 * visitors and useless for building: a refresh in the same tab would never show
 * it again. Production keeps the brief's behaviour exactly.
 *
 * The gate still needs testing, so it has not been made unreachable in dev -
 * `?intro=0` exercises the skip path, and a production build behaves as shipped.
 */
const ALWAYS_PLAY_IN_DEV = process.env.NODE_ENV !== "production";

/** Used by the Intro component, after hydration. */
export function shouldSkipIntro(): boolean {
  try {
    const forced = new URLSearchParams(window.location.search).get("intro");
    if (forced !== null) return forced === "0";
    if (ALWAYS_PLAY_IN_DEV) return false;
    return sessionStorage.getItem(INTRO_SESSION_KEY) === "1";
  } catch {
    /* private mode, or storage blocked: treat it as a first visit */
    return false;
  }
}

/**
 * The same decision, inlined into <head> and run before anything paints. It
 * marks the document, and globals.css hides the intro layer on that mark.
 * Failure tolerant on purpose: if storage throws, the attribute is never set
 * and the intro simply plays.
 */
export const INTRO_GATE_SCRIPT = `try{
var f=new URLSearchParams(location.search).get('intro');
var s=f!==null?f==='0':${
  ALWAYS_PLAY_IN_DEV ? "false" : `sessionStorage.getItem('${INTRO_SESSION_KEY}')==='1'`
};
if(s)document.documentElement.setAttribute('data-intro-played','');
}catch(e){}`.replace(/\n/g, "");
