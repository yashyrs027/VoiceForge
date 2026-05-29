// Sends typed text to the local backend and returns playable cloned speech audio.
import React from "react";
export default function useTTS() {
  const [status, setStatus] = React.useState("idle");
  const [error, setError] = React.useState("");
  const [audioUrl, setAudioUrl] = React.useState("");

  async function speak({ text, voiceId }) {
    setError("");
    setStatus("speaking");

    try {
      const response = await fetch("/api/voice/speak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, voice_id: voiceId })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Speech generation failed.");
      }

      const payload = await response.json();
      const nextAudioUrl = payload.audioUrl;
      setAudioUrl(nextAudioUrl);
      setStatus("ready");
      return { audioUrl: nextAudioUrl };
    } catch (ttsError) {
      setError(ttsError?.message || String(ttsError));
      setStatus("error");
      throw ttsError;
    }
  }

  return { speak, status, error, audioUrl };
}
