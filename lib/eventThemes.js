export const EVENT_THEMES = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean and modern',
    preview: {
      bg: '#ffffff',
      accent: '#2563eb',
      text: '#111111',
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Dark header, high contrast',
    preview: {
      bg: '#111111',
      accent: '#f97316',
      text: '#ffffff',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Light and airy',
    preview: {
      bg: '#f8fafc',
      accent: '#111111',
      text: '#111111',
    },
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Purple and refined',
    preview: {
      bg: '#faf5ff',
      accent: '#7c3aed',
      text: '#1e1b4b',
    },
  },
];

export function getTheme(id) {
  return EVENT_THEMES.find((t) => t.id === id) || EVENT_THEMES[0];
}
