import array,json,math,subprocess,wave,sys
from pathlib import Path
video_id=sys.argv[1]
brief=json.loads(Path('video-briefs.json').read_text())[video_id]
DURATION=brief['duration']
root=Path('public')/video_id
ffmpeg=Path('node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe')
SR=48000
def read(path):
    with wave.open(str(path),'rb') as w:
        assert w.getnchannels()==1 and w.getsampwidth()==2
        return array.array('h',w.readframes(w.getnframes())),w.getframerate()
def save(path,samples,rate=SR):
    with wave.open(str(path),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(array.array('h',samples).tobytes())
cues=json.loads((root/'voice-cues.json').read_text())
voice=[0.]*(SR*DURATION)
duck=[.65]*(SR*DURATION)
for c in cues:
    pcm,rate=read(root/f"leda-{c['id']}-raw.wav")
    threshold=max(160,max(abs(v) for v in pcm)*.012)
    audible=[i for i,v in enumerate(pcm) if abs(v)>threshold]
    if not audible:raise ValueError('Silent narration '+c['id'])
    first=max(0,audible[0]-int(.025*rate));last=min(len(pcm),audible[-1]+int(.055*rate))
    pcm=pcm[first:last]
    speed=max(1,len(pcm)/rate/(c['slot']-.06))
    if speed>1.4:raise ValueError(f"Narration needs a shorter take: {c['id']} at {speed:.2f}x")
    trim=root/f"leda-{c['id']}-trim.wav";out=root/f"leda-{c['id']}.wav"
    save(trim,pcm,rate)
    subprocess.run([str(ffmpeg),'-y','-v','error','-i',str(trim),'-af',f'atempo={speed:.6f},aresample=48000','-ac','1','-c:a','pcm_s16le',str(out)],check=True)
    samples,_=read(out);peak=max(abs(v) for v in samples);start=round(c['at']*SR)
    for j,v in enumerate(samples):
        fade=min(1,j/(.008*SR),(len(samples)-1-j)/(.012*SR))
        voice[start+j]+=v/peak*.78*fade
    # Smooth music ducking with a short lead-in and a longer release.
    for i in range(max(0,start-4800),min(len(duck),start+len(samples)+9600)):
        if i<start:k=(i-(start-4800))/4800
        elif i>start+len(samples):k=1-(i-start-len(samples))/9600
        else:k=1
        duck[i]=min(duck[i],.65-.43*k)
    print(f"{c['id']}: start {c['at']:.2f}s, duration {len(samples)/SR:.2f}s, tempo {speed:.2f}x")
music,_=read(root/'soundtrack.wav')
mixed=[voice[i]+music[i]/32768*duck[i] for i in range(len(voice))]
peak=max(abs(v) for v in mixed);gain=min(1,.92/peak)
save(root/'narrated-mix.wav',(int(v*gain*32767) for v in mixed))
save(root/'narration-only.wav',(int(v*32767) for v in voice))
print(f'Mix peak: {20*math.log10(peak*gain):.2f} dBFS; duration {DURATION}s')
