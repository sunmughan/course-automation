/**
 * Robust cross-browser Speech Synthesis & Recognition Helper
 * Supports English & Hindi (hi-IN / Hinglish) with sentence queuing and audio unfreeze.
 */

let speechQueue: SpeechSynthesisUtterance[] = [];
let isSpeakingInternal = false;

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    speechQueue = [];
    isSpeakingInternal = false;
  }
}

export function speakText({
  text,
  lang = "hi",
  rate = 1.0,
  onStart,
  onEnd,
  onError,
}: {
  text: string;
  lang?: "hi" | "en";
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported in this environment");
    return;
  }

  stopSpeaking();

  // Resume unpausing if browser audio engine was suspended
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  // Clean markdown and unwanted formatting characters
  const cleanText = text
    .replace(/[#*_`~>-]/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) {
    onEnd?.();
    return;
  }

  // Split into manageable sentences so Chromium doesn't silently abort on long text
  const sentences = cleanText
    .split(/(?<=[.!?।\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length === 0) {
    onEnd?.();
    return;
  }

  const voices = window.speechSynthesis.getVoices();
  const targetLang = lang === "hi" ? "hi-IN" : "en-US";

  // Find best matching voice
  let selectedVoice = voices.find((v) =>
    lang === "hi"
      ? v.lang.toLowerCase().includes("hi") || v.name.toLowerCase().includes("hindi") || v.lang.includes("IN")
      : v.lang.toLowerCase().includes("en-us") || v.lang.toLowerCase().includes("en")
  );

  let sentenceIdx = 0;
  isSpeakingInternal = true;
  onStart?.();

  function playNextSentence() {
    if (sentenceIdx >= sentences.length || !isSpeakingInternal) {
      isSpeakingInternal = false;
      onEnd?.();
      return;
    }

    const currentSentence = sentences[sentenceIdx++];
    const utterance = new SpeechSynthesisUtterance(currentSentence);
    utterance.lang = targetLang;
    utterance.rate = lang === "hi" ? 0.95 * rate : 1.0 * rate;
    utterance.pitch = 1.0;
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onend = () => {
      // Small pause between sentences for natural pacing
      setTimeout(playNextSentence, 150);
    };

    utterance.onerror = (e) => {
      console.warn("Speech utterance error:", e);
      if (sentenceIdx >= sentences.length) {
        isSpeakingInternal = false;
        onEnd?.();
      } else {
        setTimeout(playNextSentence, 100);
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  // If voices aren't loaded yet, hook onto voiceschanged
  if (voices.length === 0 && "onvoiceschanged" in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      const updatedVoices = window.speechSynthesis.getVoices();
      selectedVoice = updatedVoices.find((v) =>
        lang === "hi"
          ? v.lang.toLowerCase().includes("hi") || v.name.toLowerCase().includes("hindi") || v.lang.includes("IN")
          : v.lang.toLowerCase().includes("en-us") || v.lang.toLowerCase().includes("en")
      );
      playNextSentence();
    };
  } else {
    playNextSentence();
  }
}
