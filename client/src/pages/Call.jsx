// Renders the main call workspace for webcam preview, typed speech, output video, and virtual camera controls.
import React from "react";
import { Camera, CircleAlert } from "lucide-react";
import TextToSpeech from "../components/TextToSpeech.jsx";
import VideoPreview from "../components/VideoPreview.jsx";
import VirtualCamera from "../components/VirtualCamera.jsx";
import useTTS from "../hooks/useTTS.js";
import useVirtualCamera from "../hooks/useVirtualCamera.js";
import { getActiveVoiceProfile } from "../hooks/useVoiceClone.js";

export default function Call() {
  const [webcamStream, setWebcamStream] = React.useState(null);
  const [cameraError, setCameraError] = React.useState("");
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const canvasRef = React.useRef(null);
  const localVideoRef = React.useRef(null);
  const activeProfile = getActiveVoiceProfile();
  const { speak, status, error, audioUrl } = useTTS();
  const virtualCamera = useVirtualCamera(canvasRef);

  React.useEffect(() => {
    let activeStream = null;
    async function openCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        activeStream = stream;
        setWebcamStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (webcamError) {
        setCameraError(webcamError.message);
      }
    }
    openCamera();
    return () => {
      activeStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function handleSpeak(text) {
    if (!activeProfile?.voice_id) return;
    try {
      const result = await speak({ text, voiceId: activeProfile.voice_id });
      setIsSpeaking(true);
      const audio = new Audio(result.audioUrl);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      await audio.play();
    } catch {
      setIsSpeaking(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Header card ───────────────────────────────────────────────────── */}
      <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft dark:border-border dark:bg-surface dark:shadow-soft-dk">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-moss dark:text-glow">
              Step 2 of 3
            </p>
            <h2 className="mt-1 text-2xl font-bold dark:text-neutral-100">
              Call control room
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            <span className="rounded-md bg-mint px-3 py-2 text-ink dark:bg-glow/20 dark:text-glow">
              Voice: {activeProfile?.name || "No profile selected"}
            </span>
            <span className="rounded-md bg-cloud px-3 py-2 text-ink dark:bg-black dark:text-neutral-200">
              Virtual camera: {virtualCamera.isLive ? "Live" : "Idle"}
            </span>
          </div>
        </div>
      </section>

      {/* ── No profile warning ─────────────────────────────────────────────── */}
      {!activeProfile && (
        <div className="flex items-center gap-2 rounded-md border border-coral/40 bg-coral/10 p-4 text-sm font-semibold text-ink dark:border-coral/30 dark:bg-coral/10 dark:text-neutral-200">
          <CircleAlert size={18} aria-hidden="true" />
          Create or select a voice profile before speaking.
        </div>
      )}

      {/* ── Three-column grid ──────────────────────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr_0.9fr]">
        {/* Webcam panel */}
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-border dark:bg-surface dark:shadow-soft-dk">
          <div className="mb-4 flex items-center gap-2">
            <Camera
              size={19}
              aria-hidden="true"
              className="dark:text-neutral-300"
            />
            <h2 className="text-lg font-bold dark:text-neutral-100">
              Live webcam
            </h2>
          </div>
          {/* Video element: bg-black already looks fine in dark mode */}
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full rounded-md bg-black object-cover"
          />
          {cameraError && (
            <p className="mt-3 text-sm font-semibold text-coral">
              {cameraError}
            </p>
          )}
        </section>

        <TextToSpeech
          onSpeak={handleSpeak}
          disabled={!activeProfile}
          status={status}
        />

        <VideoPreview
          ref={canvasRef}
          webcamStream={webcamStream}
          audioUrl={audioUrl}
          isSpeaking={isSpeaking || status === "speaking"}
        />
      </div>

      <VirtualCamera
        isLive={virtualCamera.isLive}
        status={virtualCamera.status}
        onStart={virtualCamera.start}
        onStop={virtualCamera.stop}
      />

      {error && (
        <p className="rounded-md border border-coral/30 bg-white p-3 text-sm font-semibold text-coral dark:border-coral/20 dark:bg-surface">
          {error}
        </p>
      )}
    </div>
  );
}
