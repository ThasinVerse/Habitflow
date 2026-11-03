import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler);

function tokens() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return { primary: v("--chart-1"), success: v("--chart-2"), muted: v("--muted"), fg: v("--muted-foreground"), grid: v("--border"), danger: v("--chart-5") };
}

const fontFamily = "Manrope, sans-serif";

export function Donut({ done, missed }: { done: number; missed: number }) {
  const t = useMemo(tokens, []);
  return (
    <Doughnut
      data={{ labels: ["Completed", "Missed"], datasets: [{ data: [done, missed], backgroundColor: [t.primary, t.muted], borderWidth: 0 }] }}
      options={{ cutout: "72%", plugins: { legend: { position: "bottom", labels: { color: t.fg, font: { family: fontFamily } } } } }}
    />
  );
}

export function BarChart({ labels, values, max = 100, horizontal = false }: { labels: string[]; values: number[]; max?: number; horizontal?: boolean }) {
  const t = useMemo(tokens, []);
  return (
    <Bar
      data={{ labels, datasets: [{ label: "Completion %", data: values, backgroundColor: t.primary, borderRadius: 6 }] }}
      options={{
        indexAxis: horizontal ? "y" : "x",
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          [horizontal ? "x" : "y"]: { min: 0, max, ticks: { color: t.fg }, grid: { color: t.grid } },
          [horizontal ? "y" : "x"]: { ticks: { color: t.fg, font: { family: fontFamily } }, grid: { display: false } },
        },
      }}
    />
  );
}

export function LineChart({ labels, values }: { labels: string[]; values: (number | null)[] }) {
  const t = useMemo(tokens, []);
  return (
    <Line
      data={{
        labels,
        datasets: [
          { label: "Daily %", data: values, borderColor: t.primary, backgroundColor: t.primary.replace(")", " / 0.15)"), fill: true, tension: 0.35, pointRadius: 2, spanGaps: true },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { min: 0, max: 100, ticks: { color: t.fg }, grid: { color: t.grid } }, x: { ticks: { color: t.fg, maxTicksLimit: 10 }, grid: { display: false } } },
      }}
    />
  );
}
