import { useState, useCallback } from "react";

const STORAGE_KEY = "pantry_icons";

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function save(icons: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
}

export interface IconGroup {
  label: string;
  icons: string[];
}

export const ICON_GROUPS: IconGroup[] = [
  {
    label: "Pojemniki i sprzęt",
    icons: ["🧺", "🫙", "🥡", "🍱", "🧊", "🛒", "🫕", "🍶", "🥣", "🧃", "🫗", "🪣", "🥢", "🍽️", "🫙", "🧴"],
  },
  {
    label: "Dania i posiłki",
    icons: ["🥘", "🍲", "🥗", "🍜", "🍛", "🍝", "🍣", "🍤", "🌮", "🌯", "🥙", "🍔", "🌭", "🥪", "🍕", "🫔"],
  },
  {
    label: "Nabiał i jaja",
    icons: ["🧀", "🥚", "🥞", "🧇", "🥐", "🍳", "🥛", "🧈"],
  },
  {
    label: "Mięso i ryby",
    icons: ["🥩", "🍗", "🥓", "🍖", "🦐", "🦞", "🦀", "🐟", "🍱", "🥚"],
  },
  {
    label: "Warzywa",
    icons: ["🥦", "🥕", "🌽", "🥑", "🍄", "🫒", "🥔", "🧅", "🧄", "🥬", "🥒", "🫑", "🌶️", "🍅", "🫛", "🌿"],
  },
  {
    label: "Owoce",
    icons: ["🍎", "🍊", "🍋", "🍇", "🍓", "🫐", "🍑", "🍒", "🥭", "🍍", "🥝", "🍐", "🍈", "🫙", "🌰", "🥜"],
  },
  {
    label: "Pieczywo i słodycze",
    icons: ["🍞", "🥖", "🥨", "🧆", "🥯", "🧁", "🎂", "🍰", "🍩", "🍪", "🍫", "🍬", "🍭", "🍮", "🥧", "🧋"],
  },
  {
    label: "Napoje",
    icons: ["🫖", "☕", "🍵", "🧉", "🍺", "🍷", "🥂", "🍸", "🍹", "🧃", "🥤", "🫧", "🍶", "🧊", "🌊", "💧"],
  },
  {
    label: "Chemia i dom",
    icons: ["🧼", "🧴", "🪣", "🧹", "🧺", "🧻", "🪴", "🏠", "🏡", "🌱", "🌿", "✨"],
  },
];

export const PANTRY_ICON_OPTIONS = ICON_GROUPS.flatMap((g) => g.icons);

export const DEFAULT_ICON = "🧺";

export function usePantryIcons() {
  const [icons, setIcons] = useState<Record<string, string>>(load);

  const getIcon = useCallback(
    (pantryId: string) => icons[pantryId] ?? DEFAULT_ICON,
    [icons]
  );

  const setIcon = useCallback((pantryId: string, icon: string) => {
    setIcons((prev) => {
      const next = { ...prev, [pantryId]: icon };
      save(next);
      return next;
    });
  }, []);

  const removeIcon = useCallback((pantryId: string) => {
    setIcons((prev) => {
      const next = { ...prev };
      delete next[pantryId];
      save(next);
      return next;
    });
  }, []);

  return { getIcon, setIcon, removeIcon };
}
