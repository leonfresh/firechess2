"""Edit the user's shorts-gen music and meme library around the existing narration.

Run from marketing/remotion: python remix-video-audio.py camel-short|showcase
Video is stream-copied. Original exports and narration remain untouched.
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

ID = sys.argv[1]
BRIEF = json.loads(Path('video-briefs.json').read_text())[ID]
SR = 48000
DURATION = BRIEF['duration']
N = DURATION * SR
ROOT = Path('public/audio-remix')
FFMPEG = Path('node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe')

def read(path):
    with wave.open(str(path), 'rb') as w:
        assert w.getframerate() == SR and w.getsampwidth() == 2
        return np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float64).reshape(-1, w.getnchannels()) / 32768

def save(path, samples):
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(samples.shape[1]); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(samples, -.999, .999) * 32767).astype('<i2').tobytes())

def decode(name):
    path = ROOT / (name + '.wav')
    if not path.exists():
        subprocess.run([str(FFMPEG), '-y', '-v', 'error', '-i', str(ROOT/(name+'.mp3')), '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_s16le', str(path)], check=True)
    a = read(path)
    # Remove encoder padding and quiet lead-in; retain natural tails.
    active = np.flatnonzero(np.max(np.abs(a), axis=1) > max(.002, np.max(np.abs(a))*.012))
    if not len(active): raise ValueError('Silent effect: '+name)
    return a[max(0, active[0]-240):min(len(a), active[-1]+1200)]

music_source = read(ROOT/'music.wav')
music = np.zeros((N, 2)); effects = np.zeros((N, 2))
voice = np.repeat(read(Path('public')/ID/'narration-only.wav'), 2, axis=1)
assert len(voice) == N

# Select different sections of the same track: reveal, lighter explanation,
# building tactics, finish, breathing room, final lift.
sections = ([(0,4,48),(4,8.5,32),(8.5,14,40),(14,18,96)] if ID=='camel-short' else
            [(0,5,48),(5,17,8),(17,34,32),(34,42,48),(42,49,64),(49,55,80),(55,60,96)])
for start, end, source in sections:
    left, right = round(start*SR), round(end*SR)
    clip = music_source[round(source*SR):round(source*SR)+right-left].copy()
    rms = np.sqrt(np.mean(clip**2))
    # Preserve arrangement dynamics, with only mild section-level matching.
    clip *= min(2.5, .16/max(rms,.001))
    fade = min(2400,len(clip)//4)
    clip[:fade] *= np.linspace(0,1,fade)[:,None]
    clip[-fade:] *= np.linspace(1,0,fade)[:,None]
    music[left:right] += clip

gain = np.ones(N)
speech_windows = []
for cue in BRIEF['cues']:
    a = read(Path('public')/ID/f"leda-{cue['id']}.wav")
    start = round(cue['at']*SR); end = start+len(a)
    speech_windows.append((start/SR,end/SR))
    # Narration remains upfront; music swells back in between phrases.
    l=max(0,start-3600);r=min(N,end+11040)
    envelope=np.ones(r-l)*.24
    envelope[:start-l]=np.linspace(1,.24,start-l)
    envelope[end-l:]=np.linspace(.24,1,r-end)
    gain[l:r]=np.minimum(gain[l:r],envelope)

event_report = []
def effect(name, at, peak=.45, max_duration=None, speech=False):
    a=decode(name)
    if max_duration is not None:a=a[:round(max_duration*SR)]
    a=a.copy();a*=peak/max(np.max(np.abs(a)),.001)
    fade=min(1000,len(a)//5)
    a[:180]*=np.linspace(0,1,180)[:,None]
    a[-fade:]*=np.linspace(1,0,fade)[:,None]
    start=round(at*SR);end=min(N,start+len(a));a=a[:end-start]
    if speech:
        assert all(end/SR<=s or at>=e for s,e in speech_windows), f'{name} overlaps narration'
        gain[max(0,start-1800):min(N,end+2400)]=np.minimum(gain[max(0,start-1800):min(N,end+2400)],.10)
    effects[start:end]+=a
    event_report.append({'sound':name,'at':at,'end':round(end/SR,3),'spoken':speech})

if ID=='camel-short':
    effect('vine-boom',34/30,.38,max_duration=.9)
    effect('record-scratch',2.48,.25,max_duration=.38)
    effect('wait-what',2.90,.71,speech=True)
    gain[round(2.45*SR):round(3.68*SR)]*=.15
    effect('whoosh',3.78,.19,max_duration=.38)
    effect('ping-idea-lightbulb',8.50,.28,max_duration=.55)
    effect('whoosh',13.78,.20,max_duration=.38)
    effect('correct',14,.26,max_duration=.6)
else:
    effect('vine-boom',41/30,.36,max_duration=.9)
    effect('record-scratch',3.48,.23,max_duration=.24)
    effect('wait-what',3.80,.70,speech=True)
    gain[round(3.46*SR):round(4.55*SR)]*=.15
    for at in [4.78,16.78,24.78,41.78,48.78,54.78]:
        effect('whoosh',at,.14,max_duration=.32)
    effect('ping-idea-lightbulb',20.45,.23,max_duration=.48)
    for at in [791/30,896/30,1061/30,1115/30,1169/30]:
        effect('capture',at,.27,max_duration=.24)
    effect('bruh',32.55,.65,speech=True)
    effect('vine-boom',1223/30,.36,max_duration=.7)
    effect('correct',41,.29,max_duration=.65)

# Remove the reported 10–11 second thud, including any musical transient.
if ID=='showcase':
    left,right=round(9.8*SR),round(11.2*SR)
    bed=np.full(right-left,.10)
    ramp=round(.2*SR)
    bed[:ramp]=np.linspace(1,.10,ramp)
    bed[-ramp:]=np.linspace(.10,1,ramp)
    music[left:right]*=bed[:,None]
    effects[left:right]=0

# Smooth deliberate stops/ducking to prevent clicks.
gain=np.convolve(np.pad(gain,(240,240),mode='edge'),np.ones(481)/481,mode='valid')
mix=voice+music*gain[:,None]+effects
mix[-round(.45*SR):]*=np.linspace(1,0,round(.45*SR))[:,None]
peak=float(np.max(np.abs(mix)))
mix*=min(1,.88/peak)
output=Path('public')/ID/'remixed-audio.wav'
save(output,mix)
save(Path('public')/ID/'remixed-music.wav',music*gain[:,None])
save(Path('public')/ID/'remixed-effects.wav',effects)
(Path('public')/ID/'remix-cues.json').write_text(json.dumps({'music':'ChessOverdrive.mp3','sections':sections,'effects':event_report,'speechWindows':speech_windows,'peakDBFS':round(20*np.log10(np.max(np.abs(mix))),2)},indent=2))
for e in event_report:print(e)
print('Mix peak dBFS:',round(20*np.log10(np.max(np.abs(mix))),2))
subprocess.run([str(FFMPEG),'-y','-v','error','-i',f'chaos-output/chaos-chess-{ID}.mp4','-i',str(output),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-movflags','+faststart','-t',str(DURATION),f'chaos-output/chaos-chess-{ID}-remix.mp4'],check=True)
print('Finished',ID)
