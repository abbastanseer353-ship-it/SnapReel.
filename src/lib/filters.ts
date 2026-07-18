export interface VideoFilter {
  id: string
  name: string
  /** CSS/canvas filter string. Empty means no filter. */
  css: string
}

export const FILTERS: VideoFilter[] = [
  { id: 'none', name: 'Normal', css: '' },
  { id: 'vivid', name: 'Vivid', css: 'saturate(1.6) contrast(1.15)' },
  { id: 'warm', name: 'Warm', css: 'saturate(1.3) sepia(0.15) brightness(1.05)' },
  { id: 'cool', name: 'Cool', css: 'saturate(1.1) hue-rotate(200deg) brightness(1.02)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(0.55) contrast(1.1) saturate(1.2)' },
  { id: 'bw', name: 'B&W', css: 'grayscale(1) contrast(1.05)' },
  { id: 'noir', name: 'Noir', css: 'grayscale(1) contrast(1.5) brightness(0.9)' },
  { id: 'fade', name: 'Fade', css: 'contrast(0.9) brightness(1.1) saturate(0.8)' },
  { id: 'dramatic', name: 'Dramatic', css: 'contrast(1.4) brightness(0.95) saturate(1.15)' },
  { id: 'dreamy', name: 'Dreamy', css: 'blur(0.6px) brightness(1.12) saturate(1.25)' },
  { id: 'invert', name: 'Invert', css: 'invert(1)' },
]

export function getFilter(id: string): VideoFilter {
  return FILTERS.find((f) => f.id === id) ?? FILTERS[0]
}
