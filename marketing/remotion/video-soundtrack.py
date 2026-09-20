"""Original 120 BPM arcade score and tonal impacts; no sampled music or meme clips."""
import math, wave, array, json, sys
from pathlib import Path
video_id=sys.argv[1]
DURATION=json.loads(Path('video-briefs.json').read_text())[video_id]['duration']
SR=48000
audio=[0.0]*(DURATION*SR)
def tone(at,duration,hz,volume=.2,decay=5,slide=0,bright=False):
    start=int(at*SR)
    for j in range(int(duration*SR)):
        if start+j>=len(audio):break
        t=j/SR
        phase=2*math.pi*(hz*t+slide*t*t/2)
        v=math.sin(phase)
        if bright:v+=.28*math.sin(phase*2)+.12*math.sin(phase*3)
        env=min(1,t/.006)*math.exp(-decay*t/duration)*min(1,(duration-t)/.025)
        audio[start+j]+=volume*v*env
for beat in range(DURATION*2):
    at=beat*.5
    if DURATION-1<at:continue
    tone(at,.23,95,.55,5,-190)
    if beat%2:tone(at,.13,185,.16,5,60,True);tone(at+.008,.09,740,.09,6)
    note=[65.41,65.41,77.78,58.27][(beat//4)%4]
    tone(at+.015,.4,note,.26,3,0,True)
    if beat>=10:
        arp=[261.63,311.13,392,466.16,392,311.13,233.08,311.13]
        tone(at+.25,.18,arp[beat%8],.1,5,0,True)
for at in ([0,4,8.5,14] if video_id=='camel-short' else [0,5,11,17,25,34,42,49,55]):
    tone(at,.45,130,.55,5,-160)
    tone(at,.15,720,.16,6,-2600)
for at in ([1.13] if video_id=='camel-short' else [1.37,27,41]):
    tone(at,.17,523.25,.24,3,0,True);tone(at+.12,.28,783.99,.22,4,0,True)
for hz in [130.81,196,261.63,311.13,392]:tone(DURATION-4,.9,hz,.1,2,0,True)
for at in ([] if video_id=='camel-short' else [26.37,30.87,35.37,37.17,38.97,40.77]):
    tone(at,.08,420,.18,6,-800)
peak=max(abs(v) for v in audio)
pcm=array.array('h',(int(max(-1,min(1,v/peak*.86))*32767) for v in audio))
with wave.open(str(Path('public')/video_id/'soundtrack.wav'),'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
print(f'Original soundtrack: {DURATION} seconds, 48 kHz')
