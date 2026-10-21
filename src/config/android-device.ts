export function isWirelessAdbUdid(udid: string): boolean {
  const normalized = udid.trim().toLowerCase();
  return (
    normalized.includes('._adb-tls-connect._tcp') ||
    /^\[[0-9a-f:]+\]:\d+$/i.test(normalized) ||
    /^[^\s:]+:\d+$/.test(normalized)
  );
}
