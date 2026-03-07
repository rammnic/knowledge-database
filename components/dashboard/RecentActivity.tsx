"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { getMaturityEmoji } from "@/lib/utils";

interface Activity {
  id: string;
  title: string;
  slug: string;
  maturity: string;
  updatedAt: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await fetch("/api/notes/recent");
        if (res.ok) {
          const data = await res.json();
          setActivities(data.notes || []);
        }
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      }
    }
    fetchActivities();
  }, []);

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Недавняя активность</h3>
      
      {activities.length === 0 ? (
        <p className="text-muted text-sm">Пока нет заметок</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <a
              key={activity.id}
              href={`/notes/${activity.slug}`}
              className="block p-3 rounded-xl surface hover:surface-hover transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span>{getMaturityEmoji(activity.maturity)}</span>
                  <h4 className="font-medium text-white text-sm">{activity.title}</h4>
                </div>
                <span className="text-xs text-muted whitespace-nowrap">
                  {formatDate(activity.updatedAt)}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}