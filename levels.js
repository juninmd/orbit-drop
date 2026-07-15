// Level definitions. Coordinates are in an 800x520 logical play area.
export const levels = [
  {
    name: "Primeiro salto",
    start: { x: 90, y: 260 },
    goal: { x: 710, y: 260, r: 26 },
    wells: [{ x: 400, y: 260, r: 34, m: 1 }],
  },
  {
    name: "Desvio",
    start: { x: 90, y: 120 },
    goal: { x: 710, y: 400, r: 24 },
    wells: [
      { x: 360, y: 200, r: 30, m: 1.1 },
      { x: 520, y: 360, r: 26, m: 0.9 },
    ],
  },
  {
    name: "Estilingue",
    start: { x: 90, y: 430 },
    goal: { x: 720, y: 90, r: 22 },
    wells: [
      { x: 300, y: 300, r: 40, m: 1.6 },
      { x: 560, y: 180, r: 24, m: 0.7 },
    ],
  },
  {
    name: "Corredor",
    start: { x: 80, y: 260 },
    goal: { x: 730, y: 260, r: 20 },
    wells: [
      { x: 400, y: 140, r: 30, m: 1.2 },
      { x: 400, y: 380, r: 30, m: 1.2 },
    ],
  },
];
