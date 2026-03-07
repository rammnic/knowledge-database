"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getMaturityEmoji, getMaturityColor } from "@/lib/utils";

interface Stats {
  total: number;
  seed: number;
  sapling: number;
  evergreen: number;
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    seed: 0,
    sapling: 0,
    evergreen: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/notes/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    {
      label: "Всего заметок",
      value: stats.total,
      emoji: "📚",
      color: "text-white",
    },
    {
      label: "Seed",
      value: stats.seed,
      emoji: "🌱",
      color: getMaturityColor("SEED"),
    },
    {
      label: "Sapling",
      value: stats.sapling,
      emoji: "🌿",
      color: getMaturityColor("SAPLING"),
    },
    {
      label: "Evergreen",
      value: stats.evergreen,
      emoji: "🌳",
      color: getMaturityColor("EVERGREEN"),
    },
  ];

  return (
    <div className="space-y-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{card.emoji}</span>
            <span className="text-sm text-secondary">{card.label}</span>
          </div>
          <span className={`text-2xl font-bold ${card.color}`}>{card.value}</span>
        </div>
      ))}
    </div>
  );
}