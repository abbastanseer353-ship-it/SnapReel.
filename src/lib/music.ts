export interface Track {
  id: string
  name: string
  url: string
}

/**
 * Royalty-free background tracks. These are synthesized loops bundled with the
 * app (public/music), so there are no licensing concerns.
 */
export const TRACKS: Track[] = [
  { id: 'chill', name: 'Chill Vibes', url: '/music/chill.mp3' },
  { id: 'energetic', name: 'Energetic', url: '/music/energetic.mp3' },
  { id: 'lofi', name: 'Lo-Fi', url: '/music/lofi.mp3' },
]

export function getTrack(id: string | null): Track | null {
  if (!id) return null
  return TRACKS.find((t) => t.id === id) ?? null
}
