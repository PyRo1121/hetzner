/**
 * Chart Sonification with Tone.js v15
 * Phase 1, Week 4, Day 22 - Accessibility enhancements
 * Converts data points to audio for screen reader users
 */

import * as Tone from 'tone';

let synth: Tone.Synth | null = null;

/**
 * Initialize audio synth
 */
export async function initSonification() {
  if (!synth) {
    await Tone.start();
    synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.05,
        decay: 0.1,
        sustain: 0.3,
        release: 0.5,
      },
    }).toDestination();
  }
}

/**
 * Play a tone for a data point
 * Higher values = higher pitch
 */
export async function playDataPoint(value: number, min: number, max: number) {
  if (!synth) {
    await initSonification();
  }

  // Map value to frequency range (200Hz - 800Hz)
  const normalizedValue = (value - min) / (max - min);
  const frequency = 200 + normalizedValue * 600;

  synth?.triggerAttackRelease(frequency, '8n');
}

/**
 * Play a sequence of data points
 */
export async function playDataSequence(
  values: number[],
  interval: number = 100
) {
  if (values.length === 0) {return;}

  const min = Math.min(...values);
  const max = Math.max(...values);

  for (const value of values) {
    await playDataPoint(value, min, max);
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Stop all sounds
 */
export function stopSonification() {
  synth?.triggerRelease();
}

/**
 * Dispose synth
 */
export function disposeSonification() {
  synth?.dispose();
  synth = null;
}
