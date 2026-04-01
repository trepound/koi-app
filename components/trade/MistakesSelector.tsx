"use client";

import { ALL_MISTAKES } from "@/lib/koi/constants";
import type { Mistake } from "@/lib/koi/types";
import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";

export function MistakesSelector({
  selectedMistakes,
  onToggleMistake,
}: {
  selectedMistakes: Mistake[];
  onToggleMistake: (m: Mistake) => void;
}) {
  return (
    <div style={styles.mistakesBox}>
      {ALL_MISTAKES.map((mistake) => (
        <label key={mistake} style={styles.mistakeItem}>
          <input
            type="checkbox"
            checked={selectedMistakes.includes(mistake)}
            onChange={() => onToggleMistake(mistake)}
          />
          {mistake}
        </label>
      ))}
    </div>
  );
}
