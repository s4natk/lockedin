"use client";

import { useEffect, useRef, useState } from "react";

type Track = "rain" | "fireplace" | "off";

const VOLUME_KEY = "lockedin-volume";
const TRACK_KEY = "lockedin-sound";

export function AmbientAudio({ active }: { active: boolean }) {
  const [track, setTrack] = useState<Track>("rain");
  const [volume, setVolume] = useState(0.4);
  const gainRef = useRef<GainNode | null>(null);
  const volumeRef = useRef(0.4);

  useEffect(() => {
    volumeRef.current = volume;
    if (gainRef.current) gainRef.current.gain.value = volume * 0.35;
  }, [volume]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedVolume = window.localStorage.getItem(VOLUME_KEY);
      const storedTrack = window.localStorage.getItem(TRACK_KEY);
      if (storedVolume) setVolume(Number(storedVolume));
      if (storedTrack === "rain" || storedTrack === "fireplace" || storedTrack === "off") {
        setTrack(storedTrack);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!active || track === "off") {
      gainRef.current = null;
      return;
    }

    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.value = volumeRef.current * 0.35;
    gain.connect(context.destination);
    gainRef.current = gain;

    const source = context.createBufferSource();
    source.buffer = track === "rain" ? rainBuffer(context) : fireBuffer(context);
    source.loop = true;
    const filter = context.createBiquadFilter();
    if (track === "rain") {
      filter.type = "bandpass";
      filter.frequency.value = 1200;
      filter.Q.value = 0.7;
    } else {
      filter.type = "lowpass";
      filter.frequency.value = 280;
    }
    source.connect(filter);
    filter.connect(gain);
    source.start();
    void context.resume();

    return () => {
      gainRef.current = null;
      source.stop();
      void context.close();
    };
  }, [active, track]);

  function choose(next: Track) {
    setTrack(next);
    window.localStorage.setItem(TRACK_KEY, next);
  }

  function changeVolume(next: number) {
    setVolume(next);
    window.localStorage.setItem(VOLUME_KEY, String(next));
  }

  return (
    <div className="mt-8 flex items-center gap-3 text-sm text-zinc-400">
      {(["rain", "fireplace", "off"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => choose(option)}
          className={track === option ? "text-zinc-100" : "text-zinc-500"}
        >
          {option}
        </button>
      ))}
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        aria-label="Volume"
        onChange={(event) => changeVolume(Number(event.target.value))}
        className="w-24"
      />
    </div>
  );
}

function rainBuffer(context: AudioContext) {
  const length = context.sampleRate * 2;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
  return buffer;
}

function fireBuffer(context: AudioContext) {
  const length = context.sampleRate * 2;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let index = 0; index < length; index += 1) {
    last = (last + (Math.random() * 2 - 1) * 0.04) * 0.96;
    data[index] = last;
  }
  return buffer;
}
