export type SettingsTabKey = 'Profile' | 'Agents' | 'Data' | 'Config';

// One-time in-memory hint for which Settings tab to open.
// This avoids persisting "deep link" state in localStorage (which can feel like caching).
let nextSettingsTab: SettingsTabKey | null = null;

export function setNextSettingsTab(tab: SettingsTabKey) {
  nextSettingsTab = tab;
}

export function consumeNextSettingsTab(): SettingsTabKey | null {
  const v = nextSettingsTab;
  nextSettingsTab = null;
  return v;
}


