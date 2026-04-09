"use client";

import { ALL_MISTAKES, MISTAKE_DEFINITIONS } from "@/lib/koi/constants";
import type { Mistake } from "@/lib/koi/types";
import { dashboardStyles as styles } from "@/lib/koi/dashboard-styles";

export function MistakesSelector({
  mistakes: mistakeOptions = ALL_MISTAKES,
  selectedMistakes,
  onToggleMistake,
}: {
  mistakes?: Mistake[];
  selectedMistakes: Mistake[];
  onToggleMistake: (m: Mistake) => void;
}) {
  return (
    <div style={styles.mistakesBox}>
      {mistakeOptions.map((mistake) => (
        <label
          key={mistake}
          style={styles.mistakeItem}
          title={MISTAKE_DEFINITIONS[mistake]}
        >
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
