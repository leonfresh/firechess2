import { mkdir, writeFile } from 'node:fs/promises';

// Original vector sculpts. Shared pedestal, bevels and lighting keep all identities
// readable as one toy set. No fonts or third-party piece images are used.
const heads = {
  P: '<circle cx="50" cy="29" r="15"/><path d="M40 44h20l-3 14 8 14H35l8-14z"/>',
  N: '<path d="M31 72c-2-17 13-24 13-36l-13 9-10-8 13-20 2-11 12 9c19-3 30 17 28 37l-7 20z"/><path d="M51 21c13 9 15 28 10 39" fill="none" stroke="var(--edge)" stroke-width="5"/><circle cx="40" cy="25" r="3" fill="#27253b" stroke="none"/>',
  A: '<path d="M30 65c5-14 18-22 20-35-8 11-16 13-24 16l-7 7q-13-1-12-10l20-28 6-13 13 11c31-1 43 24 34 52z"/><path d="M56 19c18 9 21 28 13 42" fill="none" stroke="var(--edge)" stroke-width="5" opacity=".55"/><path d="M32 25q3-10 10-8 6 6-10 8" fill="#27253b" stroke="none"/><path d="m45 18 6-7 6 8-6 10z" fill="url(#gold)" stroke-width="2"/>',
  B: '<path d="M35 38c0-11 15-28 15-28s15 17 15 28c0 10-8 15-15 15s-15-5-15-15z"/><path d="m54 24-8 14" fill="none" stroke="var(--edge)" stroke-width="5"/><path d="M42 51h16l-1 8 9 13H34l9-13z"/>',
  R: '<path d="M29 17h10v12h7V17h9v12h7V17h10v25l-8 7 3 23H33l3-23-7-7z"/><path d="M36 43h28M42 52v11" stroke="var(--edge)" fill="none" stroke-width="4"/>',
  Q: '<path d="m27 29 11 9L50 20l12 18 11-9-8 31H35z"/><circle cx="27" cy="25" r="5" fill="url(#gold)"/><circle cx="50" cy="16" r="5" fill="url(#gold)"/><circle cx="73" cy="25" r="5" fill="url(#gold)"/><path d="M39 59h22l6 13H33z"/>',
  K: '<path d="M45 9h10v9h9v10h-9v9H45v-9h-9V18h9z" fill="url(#gold)"/><path d="M32 39q18-9 36 0l-8 19 8 14H32l8-14z"/><path d="M38 48h24" fill="none" stroke="var(--edge)" stroke-width="4"/>',
  Ca: '<path d="M33 72c0-15 20-18 17-39l-15 8q-12 0-12-9l10-14 10 1 4-13 7 14c20 3 22 21 17 34l-8 18z"/><path d="M59 31q8 15-5 30" fill="none" stroke="var(--edge)" stroke-width="5"/><circle cx="42" cy="26" r="3" fill="#27253b" stroke="none"/><path d="m24 32 10 1" stroke="var(--edge)" fill="none" stroke-width="3"/>',
};
// Each hybrid gets an actual silhouette; equipment is part of the sculpt.
const bayonet = '<path d="M77 28v44" stroke="#765432" stroke-width="5"/><path d="m77 6-7 19 7 8 7-8z" fill="#dbe9f1" stroke="#526779" stroke-width="2"/><path d="M69 35h16" stroke="url(#gold)" stroke-width="4"/>';
const rocketPawn = '<circle cx="49" cy="25" r="14"/><path d="M38 40h22l3 25H35z"/><path d="m35 49-12 18 14-5m25-13 12 18-14-5" fill="url(#gold)"/><rect x="37" y="43" width="24" height="8" rx="3" fill="url(#gold)"/><circle cx="49" cy="55" r="4" fill="#78cff0" stroke="#385b79" stroke-width="2"/><path d="m40 65 4 9 5-5 5 5 5-9" fill="#f6ae58"/>';
heads.PB = '<circle cx="44" cy="29" r="14"/><path d="M29 28q0-19 15-19t15 19z" fill="url(#gold)"/><path d="M27 29h35" stroke="url(#gold)" stroke-width="5"/><path d="M35 43h19l-2 13 11 16H27l11-16z"/><path d="m35 49 19 12" fill="none" stroke="url(#gold)" stroke-width="5"/>' + bayonet;
heads.PC = rocketPawn;
heads.PW = rocketPawn + bayonet;
heads.C = '<path d="M34 51c1-12 13-17 12-28l-13 10-9-7 12-15 2-7 11 8c19-1 30 16 23 39z"/><path d="M55 19q13 10 7 24" fill="none" stroke="var(--edge)" stroke-width="4"/><circle cx="41" cy="19" r="2.5" fill="#27253b" stroke="none"/><path d="M25 44h10v9h10v-9h10v9h10v-9h10v18l-10 5 2 6H33l2-6-10-5z"/><path d="M35 61h30" stroke="url(#gold)" stroke-width="4"/><path d="M46 68v-5q4-6 8 0v5" fill="var(--edge)" stroke-width="2"/>';
heads.Am = '<g transform="translate(0 10) scale(1 .78)">' + heads.N + '</g><path d="M36 58q14 6 28 0l-4 8 9 7H30l10-7z"/><path d="M35 58q15 8 30 0" fill="none" stroke="url(#gold)" stroke-width="5"/><path d="m27 15 10 5 9-13 10 13 12-5-5 15H32z" fill="url(#gold)" stroke="#765432" stroke-width="2"/><circle cx="27" cy="14" r="3" fill="url(#gold)"/><circle cx="46" cy="5" r="3" fill="url(#gold)"/><circle cx="68" cy="14" r="3" fill="url(#gold)"/><path d="m45 19 4 5-4 5-4-5z" fill="#9a66d6" stroke="#654388" stroke-width="1"/>';
heads.NR = '<path d="M71 8q27 22 9 48-1-26-17-32z" fill="#b8a3ee" stroke="#645181" stroke-width="2"/>' + heads.N + '<path d="m30 51 9 3-6 10-8-4z" fill="url(#gold)"/>';
// Camel: long blunt muzzle, tiny ears, curved neck and two rounded humps.
heads.Ca = '<path d="M26 72q-7-11 2-19 7-8 14 1 8-14 17-3l2-18-17 3-13-5q-5-4 0-9l19-5 4-10 6 8 7-7 3 13q10 8 7 22l-6 29z"/><path d="m31 28 12 2M63 35q7 16-4 28" fill="none" stroke="var(--edge)" stroke-width="4"/><circle cx="54" cy="24" r="2.5" fill="#27253b" stroke="none"/>';
// Anomaly identities: a royal knight, reversible pawn, and crescent queen.
heads.FK = '<g transform="translate(0 12) scale(1 .78)">' + heads.N + '</g><path d="M33 59q17 8 33 0l-5 10H38z"/><path d="m28 22 5-13 10 9 7-8 8 8 12-9 3 14-12 7H38z" fill="url(#gold)" stroke="#805d35" stroke-width="2"/><path d="M46 2h8v6h6v7h-6v6h-8v-6h-6V8h6z" fill="url(#gold)" stroke="#805d35" stroke-width="2"/>';
heads.IP = heads.P + '<path d="M22 35v27m-6-20 6-8 6 8M78 35v27m-6-8 6 8 6-8" fill="none" stroke="#53cfc2" stroke-width="5"/>';
heads.MQ = heads.Q + '<path d="M79 38a19 19 0 1 0 8 30A16 16 0 0 1 79 38z" fill="#c9b8f5" stroke="#66518d" stroke-width="2.5"/><path d="m80 45 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fff2ba" stroke="#8d76af" stroke-width="1.5"/>';
// Shop pawns: equipment explains their persistent ability at board size.
heads.CS = heads.P + '<path d="M33 28q0-21 17-21t17 21l-9-4H42z" fill="#409c9c"/><path d="M44 9V3h12v6" fill="url(#gold)"/><path d="M33 45 23 51m44-6 10 6" stroke="url(#gold)" stroke-width="8"/><path d="M23 49Q4 49 10 70l16-9zM77 49q19 0 13 21L74 61z" fill="#cbecef" stroke="#47747f" stroke-width="2"/><path d="M40 48h20l-4 10H44z" fill="url(#gold)"/>';
heads.HT = heads.P + '<path d="M76 8v64" stroke="url(#gold)" stroke-width="5"/><path d="M76 10q-15-9-30 0v23q15-9 30 0z" fill="#aa79dc" stroke="#674291" stroke-width="2"/><path d="m53 17 4 4 4-6 4 6 5-4-3 10H55z" fill="#ffe5a2" stroke="none"/><path d="M39 44q11 7 22 0l-4 14-7-4-7 4z" fill="#aa79dc"/>';
// New shop equipment keeps the ordinary piece silhouette recognizable.
heads.VK = '<g transform="translate(0 -2) scale(1 .84)">' + heads.N + '</g><path d="m38 57 24 4-24 5 24 5H38" fill="none" stroke="#2c7786" stroke-width="7"/><path d="m38 57 24 4-24 5 24 5H38" fill="none" stroke="#86f0dd" stroke-width="3"/><path d="M24 50v17m-5-12 5-6 5 6M77 50v17m-5-12 5-6 5 6" fill="none" stroke="#71dcca" stroke-width="3"/>';
heads.BS = heads.R + '<path d="M79 33v32H59" fill="none" stroke="#285466" stroke-width="9"/><path d="M79 33v32H59m6-6-6 6 6 6" fill="none" stroke="#86f0dd" stroke-width="4"/><path d="m38 49 9 9-9 9-9-9z" fill="#56c8cb" stroke="url(#gold)" stroke-width="3"/>';
const variants = { Ca:'Ca', Db:'B', Dr:'R', RC:'R', EK:'K', Hb:'B', Usp:'K', KB:'B', QC:'Q', RG:'R', SB:'B', BC:'B', BB:'B' };
function ornament(kind) {
  if (kind === 'Ca' || !variants[kind]) return '';
  if (['Db','Dr'].includes(kind)) return '<path d="m25 49-12-13 2 21 14 9M75 49l12-13-2 21-14 9" fill="#e99949" stroke="#784732" stroke-width="2"/>';
  if (['RC','QC'].includes(kind)) return '<path d="M52 47h29v12H52z" fill="url(#gold)" stroke="#765432" stroke-width="2"/><ellipse cx="81" cy="53" rx="4" ry="6" fill="#30314b"/>';
  if (kind === 'RG') return '<path d="M20 46h61v8H20z" fill="#395975" stroke="#23364e"/><path d="M18 40h24v7H18zM18 55h24v7H18zM58 40h24v7H58zM58 55h24v7H58z" fill="#78e8f8" stroke="#287792" stroke-width="2"/><path d="m10 49 8-5-3 7 8 3M78 49l10-5-3 7 8 3" fill="none" stroke="#b4f8ff" stroke-width="3"/><path d="M46 40h8v22h-8z" fill="url(#gold)"/>';
  if (kind === 'EK') return '<ellipse cx="50" cy="58" rx="35" ry="12" fill="none" stroke="url(#gold)" stroke-width="5"/><path d="m9 58 8-6v12zM91 58l-8-6v12zM50 38l-6 8h12zM50 78l-6-8h12z" fill="#f8da81" stroke="#91602f" stroke-width="2"/>';
  if (kind === 'Usp') return '<path d="M15 47q-2-18 20-20M85 55q2 18-20 20" fill="none" stroke="#b39af0" stroke-width="6"/><path d="m35 18 1 18-12-7zM65 84l-1-18 12 7z" fill="#c6b0fa" stroke="#685291" stroke-width="2"/>';
  if (kind === 'KB') return '<circle cx="71" cy="59" r="16" fill="#303549" stroke="#151d2e" stroke-width="3"/><path d="m68 43 5-5q11 2 9-8" fill="none" stroke="#98673a" stroke-width="4"/><path d="m82 19 2 8 8-3-5 8 6 4-10-1-4 7 1-11-7-4 8-1z" fill="#ffd66d" stroke="#d9833b" stroke-width="1.5"/><path d="m65 53 12 12m0-12-12 12" stroke="#e89167" stroke-width="3"/>';
  if (kind === 'SB') return '<path d="M46 47h35v9H46z" fill="url(#gold)" stroke="#765432" stroke-width="2"/><rect x="60" y="37" width="19" height="8" rx="3" fill="#445e78" stroke="#253b55" stroke-width="2"/><circle cx="81" cy="51" r="8" fill="#72d8ed" stroke="#3d627e" stroke-width="3"/><path d="M77 51h8m-4-4v8" stroke="#e5fcff" stroke-width="2"/>';
  if (kind === 'BC') return '<path d="M49 44h27l7 7-7 13H49z" fill="#9271c7" stroke="#5b3e89" stroke-width="3"/><ellipse cx="78" cy="54" rx="9" ry="12" fill="#392952" stroke="url(#gold)" stroke-width="4"/><circle cx="78" cy="54" r="5" fill="#cf9dff" stroke="none"/>';
  if (kind === 'BB') return '<path d="M85 29v40" fill="none" stroke="url(#gold)" stroke-width="6"/><path d="m57 63 23-17-21-14" fill="none" stroke="#6cd7e5" stroke-width="6"/><path d="m57 23 2 18 12-10z" fill="#a4f6f4" stroke="#3e8b9c" stroke-width="2"/>';
  if (['PC','PB','PW','KB'].includes(kind)) return '<path d="m69 45-6 14h8l-7 15 18-20h-9l6-9z" fill="#ffd261" stroke="#91602f" stroke-width="2"/>';
  if (kind === 'C') return '<path d="M34 11h7v6h6v-6h7v6h6v-6h7v13H34z" fill="url(#gold)" stroke="#765432" stroke-width="2"/>';
  if (kind === 'Hb') return '<path d="M15 49q35-15 70 0M15 54q35 15 70 0" fill="none" stroke="#b6a0ff" stroke-width="4"/>';
  return '<path d="m74 37 4 9 10 2-8 7 2 10-8-5-9 5 2-10-8-7 10-2z" fill="url(#gold)" stroke="#765432" stroke-width="2"/>';
}
function piece(color, kind) {
  const white = color === 'w';
  const edge = white ? '#9d794b' : '#202943';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="--edge:${edge}"><defs><linearGradient id="body" x1="0" x2="1" y2=".35"><stop stop-color="${white?'#fffcec':'#849ecc'}"/><stop offset=".42" stop-color="${white?'#f9e5b4':'#4c6598'}"/><stop offset="1" stop-color="${white?'#c89b62':'#263855'}"/></linearGradient><linearGradient id="gold" x1="0" x2="1" y2=".6"><stop stop-color="#fff0a4"/><stop offset=".45" stop-color="#e9b84f"/><stop offset="1" stop-color="#a86b2f"/></linearGradient></defs><ellipse cx="51" cy="89" rx="33" ry="7" fill="#12172c" opacity=".25"/><g stroke="${edge}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round" fill="url(#body)">${heads[variants[kind] || kind]}${kind === 'A' ? '<path d="M43 68h14l-3 8q12 7 32 0l-8 14q-23 1-28-11-6 12-29 11L13 77q19-7 30-1z"/><path d="M30 69h43" stroke="url(#gold)" stroke-width="6"/>' : `<rect x="31" y="68" width="38" height="8" rx="4" fill="url(#gold)"/><path d="M32 76h36l8 9q1 6-26 6t-26-6z"/><path d="M30 83q20 7 40 0" stroke="${white?'#fff5d8':'#9caed3'}" stroke-width="2" fill="none"/>`}${ornament(kind)}</g><path d="M39 73h19" stroke="#fff" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/></svg>`;
}
export async function makePieces(directory) {
  await mkdir(directory, { recursive: true });
  await Promise.all(['w','b'].flatMap(color => [...Object.keys(heads), ...Object.keys(variants)].filter((v,i,a)=>a.indexOf(v)===i).map(kind => writeFile(new URL(`${color}${kind}.svg`, directory), piece(color,kind)))));
}
