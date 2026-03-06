#!/usr/bin/env python3
"""
Generate gameshow-style sound effects for "Roast the Elo" using pure Python synthesis.
No external dependencies (uses only stdlib: wave, struct, math, random).
Outputs WAV files to public/sounds/roast/
"""

import wave, struct, math, random, os

SAMPLE_RATE = 44100
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "sounds", "roast")


def save_wav(filename, samples):
    """Save float samples [-1,1] as 16-bit mono WAV."""
    path = os.path.join(OUTPUT_DIR, filename)
    with wave.open(path, "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        for s in samples:
            s = max(-1.0, min(1.0, s))
            f.writeframes(struct.pack("<h", int(s * 32000)))
    print(f"  ✓ {filename} ({len(samples)} samples, {len(samples)/SAMPLE_RATE:.2f}s)")


def sine(freq, t):
    return math.sin(2 * math.pi * freq * t)


def noise():
    return random.random() * 2.0 - 1.0


def envelope(t, attack, decay, sustain, release, total):
    """ADSR envelope."""
    if t < attack:
        return t / attack if attack > 0 else 1.0
    elif t < attack + decay:
        return 1.0 - (1.0 - sustain) * (t - attack) / decay
    elif t < total - release:
        return sustain
    else:
        remaining = total - t
        return sustain * (remaining / release) if release > 0 else 0.0


def lowpass(samples, cutoff_freq):
    """Simple 1-pole lowpass filter."""
    rc = 1.0 / (2.0 * math.pi * cutoff_freq)
    dt = 1.0 / SAMPLE_RATE
    alpha = dt / (rc + dt)
    out = []
    prev = 0.0
    for s in samples:
        prev = prev + alpha * (s - prev)
        out.append(prev)
    return out


# ── Audience Applause ──
def gen_applause():
    """Short burst of crowd clapping — filtered noise with rhythmic amplitude modulation."""
    dur = 1.8
    n = int(dur * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Envelope: quick swell, sustain, fade
        env = envelope(t, 0.15, 0.2, 0.7, 0.6, dur)
        # Rhythmic modulation simulating individual claps (8-12 Hz flutter)
        clap_mod = 0.6 + 0.4 * abs(sine(9.5, t))
        # Layered noise with different characters
        raw = noise() * 0.5 + noise() * 0.3 + noise() * 0.2
        samples.append(raw * env * clap_mod * 0.55)
    # Bandpass-ish: lowpass to remove harsh highs
    samples = lowpass(samples, 4000)
    # Slight high-pass by subtracting a very-low lowpass
    lp_low = lowpass(samples, 200)
    samples = [s - l * 0.7 for s, l in zip(samples, lp_low)]
    save_wav("applause.wav", samples)


# ── Short Applause (for good moves) ──
def gen_applause_short():
    """Quick clap burst — 0.7s."""
    dur = 0.7
    n = int(dur * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        env = envelope(t, 0.05, 0.1, 0.6, 0.3, dur)
        clap_mod = 0.5 + 0.5 * abs(sine(12, t))
        raw = noise() * 0.6 + noise() * 0.4
        samples.append(raw * env * clap_mod * 0.45)
    samples = lowpass(samples, 3500)
    lp_low = lowpass(samples, 250)
    samples = [s - l * 0.6 for s, l in zip(samples, lp_low)]
    save_wav("applause-short.wav", samples)


# ── Buzzer (wrong answer) ──
def gen_buzzer():
    """Game show wrong-answer buzzer — harsh low buzz."""
    dur = 0.6
    n = int(dur * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        env = envelope(t, 0.01, 0.05, 0.8, 0.2, dur)
        # Low harsh square-ish wave
        s = sine(120, t) * 0.5 + sine(180, t) * 0.3 + sine(90, t) * 0.2
        # Add grit
        s += sine(240, t) * 0.15
        # Clip for harsh buzzer tone
        s = max(-0.7, min(0.7, s * 1.4))
        samples.append(s * env * 0.6)
    save_wav("buzzer.wav", samples)


# ── Bell / Ding (correct answer) ──
def gen_bell():
    """Bright bell ding — correct answer."""
    dur = 1.0
    n = int(dur * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 4.0)  # Exponential decay
        # Bell harmonics
        s = (sine(880, t) * 0.5 +
             sine(1760, t) * 0.25 +
             sine(2640, t) * 0.12 +
             sine(3520, t) * 0.06 +
             sine(1320, t) * 0.15)  # Inharmonic partial for bell character
        samples.append(s * env * 0.5)
    save_wav("bell.wav", samples)


# ── Double Bell (perfect guess) ──
def gen_bell_double():
    """Two quick dings — nailed it!"""
    dur = 1.2
    n = int(dur * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # First ding
        env1 = math.exp(-t * 5.0) if t < 0.4 else 0
        s1 = sine(880, t) * 0.4 + sine(1760, t) * 0.2 + sine(1320, t) * 0.15
        # Second ding (higher, delayed)
        t2 = t - 0.25
        env2 = math.exp(-t2 * 5.0) if t2 > 0 else 0
        s2 = sine(1100, t2 if t2 > 0 else 0) * 0.4 + sine(2200, t2 if t2 > 0 else 0) * 0.2
        samples.append((s1 * env1 + s2 * env2) * 0.5)
    save_wav("bell-double.wav", samples)


# ── Audience "Ooh" (blunder) ──
def gen_crowd_ooh():
    """Crowd gasp/ooh — for blunders. Filtered noise with vowel-like resonance."""
    dur = 1.0
    n = int(dur * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        env = envelope(t, 0.08, 0.15, 0.5, 0.4, dur)
        # Mix of pitched tones at "ooh" frequencies (~300 Hz fundamental, ~700 Hz formant)
        voiced = (sine(280 + random.gauss(0, 8), t) * 0.3 +
                  sine(340 + random.gauss(0, 10), t) * 0.2 +
                  sine(700 + random.gauss(0, 15), t) * 0.15)
        # Crowd noise texture
        n_val = noise() * 0.35
        samples.append((voiced + n_val) * env * 0.45)
    samples = lowpass(samples, 2500)
    save_wav("crowd-ooh.wav", samples)


# ── Audience Laugh ──
def gen_crowd_laugh():
    """Short sitcom-style laugh track."""
    dur = 1.5
    n = int(dur * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        env = envelope(t, 0.1, 0.2, 0.55, 0.5, dur)
        # Rhythmic "ha-ha" modulation (5-7 Hz)
        laugh_mod = 0.4 + 0.6 * max(0, sine(6.2, t))
        # Voiced character + noise
        voiced = sine(250 + random.gauss(0, 12), t) * 0.2 + sine(500 + random.gauss(0, 15), t) * 0.1
        n_val = noise() * 0.4
        samples.append((voiced + n_val) * env * laugh_mod * 0.45)
    samples = lowpass(samples, 3000)
    lp_low = lowpass(samples, 180)
    samples = [s - l * 0.5 for s, l in zip(samples, lp_low)]
    save_wav("crowd-laugh.wav", samples)


# ── Dramatic Reveal Stinger ──
def gen_reveal_stinger():
    """Short dramatic stinger for the elo reveal — ascending chord."""
    dur = 1.5
    n = int(dur * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Three ascending notes
        if t < 0.3:
            freq = 440  # A4
            env = envelope(t, 0.01, 0.05, 0.8, 0.1, 0.3)
        elif t < 0.6:
            freq = 554  # C#5
            env = envelope(t - 0.3, 0.01, 0.05, 0.8, 0.1, 0.3)
        else:
            freq = 659  # E5
            env = envelope(t - 0.6, 0.01, 0.1, 0.7, 0.5, 0.9)
        s = (sine(freq, t) * 0.4 +
             sine(freq * 2, t) * 0.15 +
             sine(freq * 0.5, t) * 0.2 +
             sine(freq * 1.5, t) * 0.08)
        samples.append(s * env * 0.5)
    save_wav("reveal-stinger.wav", samples)


# ── Drumroll (before reveal) ──
def gen_drumroll():
    """Quick drumroll crescendo for building tension."""
    dur = 2.0
    n = int(dur * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Crescendo envelope
        env = (t / dur) ** 1.5 * 0.7
        # Fast rhythmic hits (accelerating from 8 Hz to 20 Hz)
        rate = 8 + 14 * (t / dur)
        hit = max(0, sine(rate, t)) ** 4  # Sharp attack
        # Snare-like noise burst
        n_val = noise() * hit * 0.6
        # Low tone
        tone = sine(100, t) * hit * 0.3 + sine(200, t) * hit * 0.15
        samples.append((n_val + tone) * env)
    samples = lowpass(samples, 5000)
    save_wav("drumroll.wav", samples)


# ── Sad Trombone (way wrong) ──
def gen_sad_trombone():
    """Wah wah wah wahhh — descending sad trombone."""
    dur = 2.0
    n = int(dur * SAMPLE_RATE)
    samples = []
    notes = [(350, 0.0, 0.4), (310, 0.4, 0.8), (290, 0.8, 1.2), (220, 1.2, 2.0)]
    for i in range(n):
        t = i / SAMPLE_RATE
        s = 0.0
        for freq, start, end in notes:
            if start <= t < end:
                note_t = t - start
                note_dur = end - start
                env = envelope(note_t, 0.02, 0.05, 0.7, note_dur * 0.3, note_dur)
                # Brass-like: fundamental + odd harmonics
                tone = (sine(freq, t) * 0.5 +
                        sine(freq * 3, t) * 0.15 +
                        sine(freq * 5, t) * 0.05)
                # Vibrato on last note
                if freq == 220:
                    vib = 1.0 + 0.015 * sine(5, t)
                    tone = (sine(freq * vib, t) * 0.5 +
                            sine(freq * 3 * vib, t) * 0.15)
                s += tone * env
        samples.append(s * 0.5)
    save_wav("sad-trombone.wav", samples)


# ── Honk (clown moments) ──
def gen_honk():
    """Classic clown horn honk."""
    dur = 0.35
    n = int(dur * SAMPLE_RATE)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        env = envelope(t, 0.01, 0.03, 0.8, 0.1, dur)
        # Nasal honk tone
        s = (sine(320, t) * 0.4 +
             sine(480, t) * 0.25 +
             sine(640, t) * 0.15 +
             sine(160, t) * 0.2)
        # Slight pitch bend
        bend = 1.0 + 0.05 * sine(3, t)
        s = sine(320 * bend, t) * 0.4 + sine(480 * bend, t) * 0.25 + sine(160 * bend, t) * 0.2
        samples.append(s * env * 0.6)
    save_wav("honk.wav", samples)


# ── Intro Jingle ──
def gen_intro_jingle():
    """Catchy 3-note ascending jingle for game start."""
    dur = 1.0
    n = int(dur * SAMPLE_RATE)
    samples = []
    notes = [(523, 0.0, 0.2), (659, 0.2, 0.4), (784, 0.4, 1.0)]  # C5, E5, G5
    for i in range(n):
        t = i / SAMPLE_RATE
        s = 0.0
        for freq, start, end in notes:
            if t >= start:
                nt = t - start
                nd = end - start if t < end else (dur - start)
                env = envelope(nt, 0.01, 0.04, 0.6, 0.3, nd)
                if t >= end:
                    env *= math.exp(-(t - end) * 5)
                s += (sine(freq, t) * 0.35 +
                      sine(freq * 2, t) * 0.12 +
                      sine(freq * 0.5, t) * 0.15) * env
        samples.append(s * 0.5)
    save_wav("intro-jingle.wav", samples)


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("🎬 Generating Roast the Elo gameshow sounds...\n")
    gen_applause()
    gen_applause_short()
    gen_buzzer()
    gen_bell()
    gen_bell_double()
    gen_crowd_ooh()
    gen_crowd_laugh()
    gen_reveal_stinger()
    gen_drumroll()
    gen_sad_trombone()
    gen_honk()
    gen_intro_jingle()
    print(f"\n✅ All sounds saved to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
