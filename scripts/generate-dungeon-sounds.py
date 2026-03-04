#!/usr/bin/env python3
"""
Generate game sound effects for Dungeon Tactics using pure Python synthesis.
No external dependencies (uses only stdlib: wave, struct, math, random).
Outputs WAV files to public/sounds/dungeon/
"""

import wave, struct, math, random, os

SAMPLE_RATE = 22050
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "sounds", "dungeon")


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


def saw(freq, t):
    """Sawtooth wave."""
    phase = (freq * t) % 1.0
    return 2.0 * phase - 1.0


def square(freq, t):
    return 1.0 if sine(freq, t) >= 0 else -1.0


def noise():
    return random.random() * 2.0 - 1.0


def envelope(t, attack, decay, sustain_level, release, total_dur):
    """ADSR envelope."""
    if t < attack:
        return t / attack if attack > 0 else 1.0
    elif t < attack + decay:
        return 1.0 - (1.0 - sustain_level) * (t - attack) / decay
    elif t < total_dur - release:
        return sustain_level
    elif release > 0:
        return sustain_level * max(0, (total_dur - t) / release)
    return 0.0


def fade_out(samples, fade_samples):
    """Apply fade-out to the last N samples."""
    n = len(samples)
    for i in range(fade_samples):
        idx = n - fade_samples + i
        if 0 <= idx < n:
            samples[idx] *= 1.0 - (i / fade_samples)
    return samples


def fade_in(samples, fade_samples):
    for i in range(min(fade_samples, len(samples))):
        samples[i] *= i / fade_samples
    return samples


def mix(*sample_lists):
    """Mix multiple sample lists together (normalized)."""
    max_len = max(len(s) for s in sample_lists)
    result = [0.0] * max_len
    for sl in sample_lists:
        for i, v in enumerate(sl):
            result[i] += v
    # Normalize
    peak = max(abs(s) for s in result) if result else 1.0
    if peak > 1.0:
        result = [s / peak for s in result]
    return result


# ────────────────────────────────────────────────────────
#  Sound generators
# ────────────────────────────────────────────────────────

def gen_battle_start():
    """Tense battle stinger — ascending brass-like sweep with impact."""
    dur = 1.2
    n = int(SAMPLE_RATE * dur)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Ascending frequency sweep 150 → 500
        freq = 150 + 350 * (t / dur) ** 0.7
        # Brass-like: fundamental + odd harmonics
        val = 0.5 * sine(freq, t) + 0.25 * sine(freq * 3, t) + 0.12 * sine(freq * 5, t)
        # Crescendo envelope
        env = min(1.0, t * 3) * envelope(t, 0.05, 0.1, 0.9, 0.3, dur)
        # Add some grit
        val += 0.08 * noise()
        samples.append(val * env * 0.7)
    # Impact hit at end
    impact = []
    for i in range(int(SAMPLE_RATE * 0.15)):
        t = i / SAMPLE_RATE
        val = 0.6 * sine(80, t) + 0.3 * noise()
        env = max(0, 1.0 - t * 12)
        impact.append(val * env * 0.5)
    # Overlay impact near end
    offset = n - int(SAMPLE_RATE * 0.3)
    for i, v in enumerate(impact):
        idx = offset + i
        if idx < len(samples):
            samples[idx] = max(-1, min(1, samples[idx] + v))
    return samples


def gen_boss_intro():
    """Ominous deep drone with rumble for boss encounters."""
    dur = 2.5
    n = int(SAMPLE_RATE * dur)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Deep fundamental with slight detuning for rumble
        val = (
            0.35 * sine(55, t)
            + 0.3 * sine(55.5, t)  # detune for beating
            + 0.15 * sine(82.5, t)  # fifth
            + 0.1 * sine(110, t)   # octave
            + 0.05 * saw(27.5, t)  # sub bass
        )
        # Crescendo then fade
        env = envelope(t, 0.8, 0.3, 0.85, 0.8, dur)
        # Add rumble noise
        val += 0.06 * noise() * env
        samples.append(val * env * 0.65)
    return fade_out(samples, int(SAMPLE_RATE * 0.4))


def gen_perk_pickup():
    """Magical ascending chime — power-up feel."""
    dur = 0.9
    # Quick ascending notes: C5, E5, G5, C6
    freqs = [523.25, 659.25, 783.99, 1046.50]
    note_dur = 0.18
    gap = 0.03
    all_samples = [0.0] * int(SAMPLE_RATE * dur)
    for idx, freq in enumerate(freqs):
        start_t = idx * (note_dur + gap)
        start_sample = int(start_t * SAMPLE_RATE)
        for i in range(int(note_dur * SAMPLE_RATE)):
            t = i / SAMPLE_RATE
            # Bell-like: fundamental + inharmonic partials
            val = (
                0.5 * sine(freq, t)
                + 0.25 * sine(freq * 2.01, t)  # slightly detuned
                + 0.15 * sine(freq * 3.02, t)
                + 0.08 * sine(freq * 5.04, t)
            )
            env = math.exp(-t * 8) * min(1.0, t * 100)  # fast attack, exp decay
            j = start_sample + i
            if j < len(all_samples):
                all_samples[j] += val * env * 0.45
    # Add sparkle shimmer
    for i in range(len(all_samples)):
        t = i / SAMPLE_RATE
        shimmer = 0.05 * sine(4000 + 2000 * sine(7, t), t) * math.exp(-t * 3)
        all_samples[i] += shimmer
    return all_samples


def gen_damage():
    """Impact hit — low thud + noise burst."""
    dur = 0.45
    n = int(SAMPLE_RATE * dur)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Low impact thud
        freq = 80 * math.exp(-t * 8)  # pitch drops
        val = 0.6 * sine(freq, t)
        # Noise burst
        val += 0.4 * noise() * math.exp(-t * 15)
        # Sharp attack, fast decay
        env = math.exp(-t * 6) * min(1.0, t * 200)
        samples.append(val * env * 0.7)
    return samples


def gen_heal():
    """Gentle ascending sparkle sweep."""
    dur = 1.0
    n = int(SAMPLE_RATE * dur)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Ascending sweep 400 → 1600
        freq = 400 + 1200 * (t / dur)
        val = 0.4 * sine(freq, t) + 0.2 * sine(freq * 2, t) + 0.1 * sine(freq * 3, t)
        # Soft envelope
        env = envelope(t, 0.15, 0.15, 0.6, 0.5, dur)
        # Add gentle shimmer
        val += 0.08 * sine(freq * 4, t) * sine(5, t)
        samples.append(val * env * 0.5)
    return samples


def gen_shop_buy():
    """Coins jingling — multiple metallic pings."""
    dur = 0.7
    all_samples = [0.0] * int(SAMPLE_RATE * dur)
    # Multiple coin pings at different times
    pings = [
        (0.0, 3200, 0.8),
        (0.08, 3800, 0.6),
        (0.15, 2900, 0.5),
        (0.22, 4200, 0.4),
        (0.30, 3500, 0.3),
    ]
    for start, freq, amp in pings:
        start_s = int(start * SAMPLE_RATE)
        for i in range(int(0.25 * SAMPLE_RATE)):
            t = i / SAMPLE_RATE
            val = sine(freq, t) + 0.3 * sine(freq * 2.3, t) + 0.15 * sine(freq * 3.7, t)
            env = math.exp(-t * 16) * min(1.0, t * 500)
            j = start_s + i
            if j < len(all_samples):
                all_samples[j] += val * env * amp * 0.35
    return all_samples


def gen_victory():
    """Triumphant ascending fanfare chord."""
    dur = 2.2
    n = int(SAMPLE_RATE * dur)
    # Chord: C4-E4-G4 → C5-E5-G5 with crescendo
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        progress = t / dur
        # Chord frequencies rise gradually
        base = 261.63 + 261.63 * progress  # C4 → C5
        val = (
            0.25 * sine(base, t)
            + 0.2 * sine(base * 5 / 4, t)    # major third
            + 0.18 * sine(base * 3 / 2, t)    # fifth
            + 0.12 * sine(base * 2, t)         # octave
            + 0.08 * sine(base * 5 / 2, t)    # high third
        )
        # Bright harmonics increase over time
        val += 0.06 * sine(base * 3, t) * progress
        # Crescendo then sustain then fade
        env = envelope(t, 0.3, 0.2, 0.9, 0.6, dur)
        samples.append(val * env * 0.6)
    # Add sparkle layer
    sparkle = []
    for i in range(n):
        t = i / SAMPLE_RATE
        val = 0.04 * sine(2093 + 500 * sine(3, t), t) * envelope(t, 0.5, 0.3, 0.3, 0.8, dur)
        sparkle.append(val)
    return mix(samples, sparkle)


def gen_death():
    """Somber descending tone."""
    dur = 2.0
    n = int(SAMPLE_RATE * dur)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Descending frequency
        freq = 300 - 200 * (t / dur)
        val = (
            0.4 * sine(freq, t)
            + 0.2 * sine(freq * 0.5, t)  # sub octave
            + 0.1 * saw(freq * 0.25, t)
        )
        env = envelope(t, 0.1, 0.3, 0.5, 1.0, dur)
        # Add desolate noise
        val += 0.04 * noise() * env
        samples.append(val * env * 0.55)
    return fade_out(samples, int(SAMPLE_RATE * 0.8))


def gen_footstep():
    """Quick stone footstep tap."""
    dur = 0.2
    n = int(SAMPLE_RATE * dur)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Low thud + click
        val = 0.5 * sine(120 * math.exp(-t * 20), t) + 0.3 * noise() * math.exp(-t * 30)
        # Very fast decay
        env = math.exp(-t * 18)
        samples.append(val * env * 0.6)
    return samples


def gen_event():
    """Mysterious atmospheric chime for events."""
    dur = 1.3
    n = int(SAMPLE_RATE * dur)
    # Ethereal dissonant intervals
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        val = (
            0.3 * sine(440, t)
            + 0.25 * sine(466.16, t)   # slightly sharp — tension
            + 0.15 * sine(659.25, t)   # E5
            + 0.1 * sine(880, t)
        )
        # Phase modulation for eerie quality
        val += 0.1 * sine(440 + 20 * sine(2, t), t)
        env = envelope(t, 0.2, 0.2, 0.5, 0.7, dur)
        samples.append(val * env * 0.45)
    return fade_out(samples, int(SAMPLE_RATE * 0.5))


def gen_coin():
    """Single bright coin ping."""
    dur = 0.35
    n = int(SAMPLE_RATE * dur)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        freq = 3500
        val = sine(freq, t) + 0.3 * sine(freq * 2.1, t) + 0.15 * sine(freq * 3.8, t)
        env = math.exp(-t * 12) * min(1.0, t * 300)
        samples.append(val * env * 0.45)
    return samples


def gen_level_up():
    """Bright level-up / floor completed stinger."""
    dur = 1.0
    n = int(SAMPLE_RATE * dur)
    # Fast arpeggio: C5-E5-G5-C6 then sustain C6
    notes = [(523.25, 0.0), (659.25, 0.1), (783.99, 0.2), (1046.50, 0.3)]
    all_samples = [0.0] * n
    for freq, start in notes:
        s = int(start * SAMPLE_RATE)
        for i in range(int(0.6 * SAMPLE_RATE)):
            t = i / SAMPLE_RATE
            val = 0.35 * sine(freq, t) + 0.15 * sine(freq * 2, t) + 0.08 * sine(freq * 3, t)
            env = math.exp(-t * 4) * min(1.0, t * 100)
            j = s + i
            if j < n:
                all_samples[j] += val * env * 0.5
    return all_samples


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Generating Dungeon Tactics sound effects...")
    print(f"Output: {OUTPUT_DIR}\n")

    generators = {
        "BattleStart.wav": gen_battle_start,
        "BossIntro.wav": gen_boss_intro,
        "PerkPickup.wav": gen_perk_pickup,
        "Damage.wav": gen_damage,
        "Heal.wav": gen_heal,
        "ShopBuy.wav": gen_shop_buy,
        "Victory.wav": gen_victory,
        "Death.wav": gen_death,
        "Footstep.wav": gen_footstep,
        "Event.wav": gen_event,
        "Coin.wav": gen_coin,
        "LevelUp.wav": gen_level_up,
    }

    for filename, gen in generators.items():
        try:
            samples = gen()
            save_wav(filename, samples)
        except Exception as e:
            print(f"  ✗ {filename}: {e}")

    print(f"\nDone! Generated {len(generators)} sound files.")


if __name__ == "__main__":
    main()
