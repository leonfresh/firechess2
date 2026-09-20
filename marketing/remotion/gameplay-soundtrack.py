"""Original 120 BPM arcade score and tonal impacts; no sampled music or meme clips."""
import math, wave, array
SR=48000
audio=[0.0]*(24*SR)
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
for beat in range(48):
    at=beat*.5
    if 2.4<at<3:continue
    tone(at,.23,95,.55,5,-190)
    if beat%2:tone(at,.13,185,.16,5,60,True);tone(at+.008,.09,740,.09,6)
    note=[65.41,65.41,77.78,58.27][(beat//4)%4]
    tone(at+.015,.4,note,.26,3,0,True)
    if beat>=10:
        arp=[261.63,311.13,392,466.16,392,311.13,233.08,311.13]
        tone(at+.25,.18,arp[beat%8],.1,5,0,True)
for at in [0,3,6,10.8,14.5,18.4,20]:
    tone(at,.45,130,.55,5,-160)
    tone(at,.15,720,.16,6,-2600)
for at in [1,11.7,18.3]:
    tone(at,.17,523.25,.24,3,0,True);tone(at+.12,.28,783.99,.22,4,0,True)
for hz in [130.81,196,261.63,311.13,392]:tone(20,.9,hz,.1,2,0,True)
for at in [6.67,7.87,9.07,10.27,15.3,16.8,18.3]:
    tone(at,.08,420,.18,6,-800)
peak=max(abs(v) for v in audio)
pcm=array.array('h',(int(max(-1,min(1,v/peak*.86))*32767) for v in audio))
with wave.open('public/gameplay/soundtrack.wav','wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
print('Original soundtrack: 24 seconds, 48 kHz, peak -1.3 dBFS')
