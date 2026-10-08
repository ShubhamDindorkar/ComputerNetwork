export function parseIpv4(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

export function formatIpv4(n: number): string {
  return [
    (n >>> 24) & 255,
    (n >>> 16) & 255,
    (n >>> 8) & 255,
    n & 255,
  ].join(".");
}

export function maskToPrefix(mask: string): number | null {
  const m = parseIpv4(mask);
  if (m === null) return null;
  let bits = 0;
  for (let i = 31; i >= 0; i--) {
    if (m & (1 << i)) bits++;
    else break;
  }
  const inv = (~m >>> 0) & 0xffffffff;
  if ((inv + 1) & inv) return null;
  return bits;
}

export function sameSubnet(ip: string, other: string, mask: string): boolean {
  const a = parseIpv4(ip);
  const b = parseIpv4(other);
  const m = parseIpv4(mask);
  if (a === null || b === null || m === null) return false;
  return (a & m) === (b & m);
}

export function networkAddress(ip: string, mask: string): string | null {
  const a = parseIpv4(ip);
  const m = parseIpv4(mask);
  if (a === null || m === null) return null;
  return formatIpv4(a & m);
}

export function wildcardFromMask(mask: string): string | null {
  const m = parseIpv4(mask);
  if (m === null) return null;
  return formatIpv4((~m >>> 0) & 0xffffffff);
}

export function matchWildcard(network: string, wildcard: string, ip: string): boolean {
  const n = parseIpv4(network);
  const w = parseIpv4(wildcard);
  const i = parseIpv4(ip);
  if (n === null || w === null || i === null) return false;
  return (i & ~w) === (n & ~w);
}

export function nextIp(ip: string): string | null {
  const n = parseIpv4(ip);
  if (n === null || n >= 0xffffffff) return null;
  return formatIpv4(n + 1);
}

export function ipInRange(ip: string, start: string, end: string): boolean {
  const a = parseIpv4(ip);
  const s = parseIpv4(start);
  const e = parseIpv4(end);
  if (a === null || s === null || e === null) return false;
  return a >= s && a <= e;
}

export function randomApipa(): string {
  const third = Math.floor(Math.random() * 254) + 1;
  const fourth = Math.floor(Math.random() * 254) + 1;
  return `169.254.${third}.${fourth}`;
}
