interface HudProps {
  level: number;
  size: number;
  mirrors: number;
  streak: number;
  score: number;
}

export function Hud({ level, size, mirrors, streak, score }: HudProps) {
  const items = [
    ["Level", level], ["Grid size", `${size} × ${size}`], ["Mirrors", mirrors],
    ["Current streak", streak], ["Score", score],
  ];
  return (
    <div className="hud" aria-label="Game statistics">
      {items.map(([label, value]) => (
        <div className="hud-item" key={label}>
          <span>{label}</span><strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}
