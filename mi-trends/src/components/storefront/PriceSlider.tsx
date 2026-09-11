"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrency } from "@/context/SettingsContext";

interface PriceSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  onCommit: (value: [number, number]) => void;
}

/**
 * Dual-thumb range slider. Two stacked native range inputs give us keyboard
 * and screen-reader support for free; the visual track is drawn behind them.
 */
export function PriceSlider({
  min,
  max,
  value,
  onChange,
  onCommit,
}: PriceSliderProps) {
  const formatCurrency = useCurrency();
  const [low, high] = value;
  const trackRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Keep the step meaningful across very different price ranges.
    const span = max - min;
    setStep(span > 20000 ? 500 : span > 5000 ? 100 : 10);
  }, [min, max]);

  const percent = useCallback(
    (v: number) => (max === min ? 0 : ((v - min) / (max - min)) * 100),
    [min, max],
  );

  const setLow = (next: number) => {
    // Thumbs may meet but never cross.
    const clamped = Math.min(next, high);
    onChange([clamped, high]);
  };

  const setHigh = (next: number) => {
    const clamped = Math.max(next, low);
    onChange([low, clamped]);
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between text-body-sm text-ink">
        <span className="tabular-nums">{formatCurrency(low)}</span>
        <span className="tabular-nums">{formatCurrency(high)}</span>
      </div>

      <div ref={trackRef} className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-ink/10" />
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-accent"
          style={{
            left: `${percent(low)}%`,
            right: `${100 - percent(high)}%`,
          }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          aria-label="Minimum price"
          onChange={(e) => setLow(Number(e.target.value))}
          onMouseUp={() => onCommit([low, high])}
          onTouchEnd={() => onCommit([low, high])}
          onKeyUp={() => onCommit([low, high])}
          className="pointer-events-none absolute inset-x-0 top-1/2 h-6 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-card"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          aria-label="Maximum price"
          onChange={(e) => setHigh(Number(e.target.value))}
          onMouseUp={() => onCommit([low, high])}
          onTouchEnd={() => onCommit([low, high])}
          onKeyUp={() => onCommit([low, high])}
          className="pointer-events-none absolute inset-x-0 top-1/2 h-6 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-card"
        />
      </div>
    </div>
  );
}
