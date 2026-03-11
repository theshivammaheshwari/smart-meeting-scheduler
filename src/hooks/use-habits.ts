"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Habit, HabitEntry, MoodEntry } from "@/types";

/* ─── Helpers ─── */

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getWeekNumber(day: number): number {
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  if (day <= 28) return 4;
  return 5;
}

export function getMonthName(month: number): string {
  return [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][month];
}

const HABIT_COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
];

const HABIT_ICONS = ["📚", "🏋️", "💧", "🧘", "✍️", "🎯", "💤", "🥗", "🏃", "💰", "📱", "🎸"];

export { HABIT_COLORS, HABIT_ICONS };

/* ─── Main Hook ─── */

export function useHabits(userId: string | undefined) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Date range for current month
  const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(getDaysInMonth(currentYear, currentMonth)).padStart(2, "0")}`;

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [habitsRes, entriesRes, moodRes] = await Promise.all([
      supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("habit_entries")
        .select("*, habits!inner(user_id)")
        .eq("habits.user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate),
      supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true }),
    ]);

    if (habitsRes.data) setHabits(habitsRes.data);
    if (entriesRes.data) setEntries(entriesRes.data);
    if (moodRes.data) setMoodEntries(moodRes.data);

    setLoading(false);
  }, [userId, supabase, startDate, endDate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ─── Habits CRUD ─── */

  const addHabit = async (name: string, color: string, icon: string) => {
    if (!userId) return;
    const { data } = await supabase
      .from("habits")
      .insert({ user_id: userId, name, color, icon, sort_order: habits.length })
      .select()
      .single();
    if (data) setHabits((prev) => [...prev, data]);
  };

  const deleteHabit = async (habitId: string) => {
    await supabase.from("habits").delete().eq("id", habitId);
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setEntries((prev) => prev.filter((e) => e.habit_id !== habitId));
  };

  const updateHabit = async (habitId: string, name: string, color: string, icon: string) => {
    await supabase.from("habits").update({ name, color, icon }).eq("id", habitId);
    setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, name, color, icon } : h)));
  };

  /* ─── Toggle Entry ─── */

  const toggleEntry = async (habitId: string, date: string) => {
    const existing = entries.find((e) => e.habit_id === habitId && e.date === date);

    if (existing) {
      if (existing.completed) {
        // Remove entry
        await supabase.from("habit_entries").delete().eq("id", existing.id);
        setEntries((prev) => prev.filter((e) => e.id !== existing.id));
      } else {
        // Mark completed
        await supabase.from("habit_entries").update({ completed: true }).eq("id", existing.id);
        setEntries((prev) => prev.map((e) => (e.id === existing.id ? { ...e, completed: true } : e)));
      }
    } else {
      // Create new entry
      const { data } = await supabase
        .from("habit_entries")
        .insert({ habit_id: habitId, date, completed: true })
        .select()
        .single();
      if (data) setEntries((prev) => [...prev, data]);
    }
  };

  const isCompleted = (habitId: string, date: string): boolean => {
    return entries.some((e) => e.habit_id === habitId && e.date === date && e.completed);
  };

  /* ─── Mood CRUD ─── */

  const saveMood = async (date: string, mood: number, energy: number, motivation: number) => {
    if (!userId) return;
    const existing = moodEntries.find((m) => m.date === date);

    if (existing) {
      await supabase.from("mood_entries").update({ mood, energy, motivation }).eq("id", existing.id);
      setMoodEntries((prev) => prev.map((m) => (m.id === existing.id ? { ...m, mood, energy, motivation } : m)));
    } else {
      const { data } = await supabase
        .from("mood_entries")
        .insert({ user_id: userId, date, mood, energy, motivation })
        .select()
        .single();
      if (data) setMoodEntries((prev) => [...prev, data]);
    }
  };

  const getMood = (date: string): MoodEntry | undefined => {
    return moodEntries.find((m) => m.date === date);
  };

  /* ─── Analytics ─── */

  const getHabitStats = (habitId: string) => {
    const totalDays = getDaysInMonth(currentYear, currentMonth);
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
    const activeDays = isCurrentMonth ? today.getDate() : totalDays;
    const completedDays = entries.filter((e) => e.habit_id === habitId && e.completed).length;
    const percentage = activeDays > 0 ? Math.round((completedDays / activeDays) * 100) : 0;
    return { completedDays, totalDays, activeDays, percentage };
  };

  const getWeeklyStats = (habitId: string, week: number) => {
    const totalDays = getDaysInMonth(currentYear, currentMonth);
    let weekStart: number, weekEnd: number;
    switch (week) {
      case 1: weekStart = 1; weekEnd = 7; break;
      case 2: weekStart = 8; weekEnd = 14; break;
      case 3: weekStart = 15; weekEnd = 21; break;
      case 4: weekStart = 22; weekEnd = 28; break;
      default: weekStart = 29; weekEnd = totalDays; break;
    }
    // Clamp to actual days
    weekEnd = Math.min(weekEnd, totalDays);
    const count = entries.filter((e) => {
      if (e.habit_id !== habitId || !e.completed) return false;
      const day = parseInt(e.date.split("-")[2], 10);
      return day >= weekStart && day <= weekEnd;
    }).length;
    const daysInWeek = weekEnd - weekStart + 1;
    return { count, total: daysInWeek, percentage: daysInWeek > 0 ? Math.round((count / daysInWeek) * 100) : 0 };
  };

  const getDashboardStats = () => {
    const totalHabits = habits.length;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const completedToday = habits.filter((h) => isCompleted(h.id, todayStr)).length;
    const completionPct = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
    return { totalHabits, completedToday, completionPct };
  };

  const getRankedHabits = () => {
    return habits
      .map((h) => ({ ...h, stats: getHabitStats(h.id) }))
      .sort((a, b) => b.stats.percentage - a.stats.percentage);
  };

  const getDailyCompletionTrend = () => {
    const totalDays = getDaysInMonth(currentYear, currentMonth);
    const trend: { day: number; percentage: number }[] = [];
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const completed = habits.filter((h) => isCompleted(h.id, dateStr)).length;
      const pct = habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0;
      trend.push({ day: d, percentage: pct });
    }
    return trend;
  };

  /* ─── Month Navigation ─── */

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return {
    habits,
    entries,
    moodEntries,
    loading,
    currentMonth,
    currentYear,
    addHabit,
    deleteHabit,
    updateHabit,
    toggleEntry,
    isCompleted,
    saveMood,
    getMood,
    getHabitStats,
    getWeeklyStats,
    getDashboardStats,
    getRankedHabits,
    getDailyCompletionTrend,
    prevMonth,
    nextMonth,
    refetch: fetchAll,
  };
}
