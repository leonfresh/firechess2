'use client';
let identity: string | null = null;
export function setChaosIdentity(value: string) { identity = value; }
export function chaosIdentityHeaders(): Record<string,string> { return identity ? {'X-Chaos-Identity':identity} : {}; }
