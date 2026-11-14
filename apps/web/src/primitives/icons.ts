// Lucide Icons (ISC License)
// Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT).
// All other copyright (c) for Lucide are held by Lucide Contributors 2022.
// Permission to use, copy, modify, and/or distribute this software for any purpose with or without
// fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

export type IconName =
  | 'x'
  | 'chevron-down'
  | 'chevron-right'
  | 'sun'
  | 'moon'
  | 'sun-moon'
  | 'menu'
  | 'info'
  | 'check-circle'
  | 'alert-triangle'
  | 'alert-circle'
  | 'more-horizontal'
  | 'copy'
  | 'plus'
  | 'file-text'
  | 'layers'
  | 'loader';

export type IconSize = 16 | 20 | 24;

export interface IconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
}

const LUCIDE_SYMBOLS: Record<IconName, string> = {
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  'sun-moon':
    '<path d="M12 8a2.83 2.83 0 0 0 4 4 4 4 0 1 1-4-4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
  'alert-triangle':
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  'alert-circle':
    '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  'more-horizontal':
    '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  'file-text':
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  layers:
    '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  loader:
    '<path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/>',
};

export const LUCIDE_ICON_NAMES: IconName[] = [
  'x',
  'chevron-down',
  'chevron-right',
  'moon',
  'sun',
  'menu',
  'info',
  'check-circle',
  'alert-triangle',
  'alert-circle',
  'more-horizontal',
  'copy',
  'plus',
  'file-text',
  'layers',
  'loader',
];

export function renderIconSprite(): string {
  const symbols = (Object.entries(LUCIDE_SYMBOLS) as Array<[IconName, string]>)
    .map(
      ([name, paths]) =>
        `<symbol id="lp-icon-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</symbol>`
    )
    .join('');
  return `<svg id="lp-icon-sprite" class="lp-icon-sprite" aria-hidden="true" focusable="false"><defs>${symbols}</defs></svg>`;
}

export function renderIcon(
  nameOrProps: IconName | IconProps,
  sizeArg: IconSize = 16,
  classNameArg?: string
): string {
  const name: IconName = typeof nameOrProps === 'string' ? nameOrProps : nameOrProps.name;
  const rawSize = typeof nameOrProps === 'string' ? sizeArg : (nameOrProps.size ?? 16);
  const size: IconSize = rawSize === 20 || rawSize === 24 ? rawSize : 16;
  const extraClass = typeof nameOrProps === 'string' ? classNameArg : nameOrProps.className;
  const classes = ['lp-icon', `lp-icon-${size}`, extraClass].filter(Boolean).join(' ');
  return `<svg class="${classes}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="#lp-icon-${name}"></use></svg>`;
}
