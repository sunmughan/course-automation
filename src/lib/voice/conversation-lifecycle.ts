/**
 * Real-Time Voice Conversation Lifecycle & Natural Interruption Controller
 * Manages states (idle, listening, processing, speaking, interrupted, error) and cancels
 * active speech synthesis when student voice is detected mid-sentence.
 */

import { speakText, stopSpeaking } from "@/lib/speech";

export type VoiceTutorState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "interrupted"
  | "paused"
  | "error";

export interface VoiceSessionConfig {
  language: "hi" | "en";
  topicTitle: string;
  courseTitle: string;
  onStateChange: (state: VoiceTutorState) => void;
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onAiResponse: (answer: string) => void;
  onError: (err: string) => void;
}

export class VoiceConversationController {
  private state: VoiceTutorState = "idle";
  private recognition: any = null;
  private config: VoiceSessionConfig;
  private isInterrupted = false;

  constructor(config: VoiceSessionConfig) {
    this.config = config;
  }

  public getState(): VoiceTutorState {
    return this.state;
  }

  private setState(newState: VoiceTutorState) {
    this.state = newState;
    this.config.onStateChange(newState);
  }

  /**
   * Starts listening to student speech with interruption detection
   */
  public startListening() {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      this.config.onError("Speech recognition not supported in this browser");
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.lang = this.config.language === "hi" ? "hi-IN" : "en-US";
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onstart = () => {
        this.setState("listening");
      };

      this.recognition.onresult = (event: any) => {
        // If AI is currently speaking and user speaks, interrupt immediately!
        if (this.state === "speaking") {
          this.interrupt();
        }

        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const text = final || interim;
        if (text) {
          this.config.onTranscript(text, Boolean(final));
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          console.warn("Voice tutor recognition error:", event.error);
        }
      };

      this.recognition.onend = () => {
        if (this.state === "listening") {
          // Restart to keep streaming listening active
          try {
            this.recognition.start();
          } catch {
            this.setState("idle");
          }
        }
      };

      this.recognition.start();
    } catch (err: any) {
      this.setState("error");
      this.config.onError(err.message || "Failed to start microphone");
    }
  }

  /**
   * Natural voice interruption: stops TTS audio immediately when student talks
   */
  public interrupt() {
    this.isInterrupted = true;
    stopSpeaking();
    this.setState("interrupted");
    setTimeout(() => {
      this.setState("listening");
      this.isInterrupted = false;
    }, 300);
  }

  /**
   * Speaks the tutor's response aloud
   */
  public speak(response: string) {
    this.setState("speaking");
    speakText({
      text: response,
      lang: this.config.language,
      onStart: () => {
        if (!this.isInterrupted) this.setState("speaking");
      },
      onEnd: () => {
        if (this.state === "speaking") this.setState("idle");
      },
      onError: () => {
        this.setState("idle");
      },
    });
  }

  /**
   * Stops the voice session cleanly
   */
  public stop() {
    stopSpeaking();
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
    this.setState("idle");
  }
}
