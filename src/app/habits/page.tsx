"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Target,
  TrendingUp,
  BarChart3,
  Smile,
  Zap,
  Flame,
  X,
  Edit3,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  useHabits,
  getDaysInMonth,
  getWeekNumber,
  getMonthName,
  HABIT_COLORS,
  HABIT_ICONS,
} from "@/hooks/use-habits";

export default function HabitTrackerPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    habits,
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
  } = useHabits(user?.id);

  const [activeTab, setActiveTab] = useState<"tracker" | "analytics" | "mood">("tracker");
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitColor, setNewHabitColor] = useState(HABIT_COLORS[0]);
  const [newHabitIcon, setNewHabitIcon] = useState(HABIT_ICONS[0]);
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editIcon, setEditIcon] = useState("");

  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-8 h-10 w-64" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const { totalHabits, completedToday, completionPct } = getDashboardStats();

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) return;
    await addHabit(newHabitName.trim(), newHabitColor, newHabitIcon);
    setNewHabitName("");
    setNewHabitColor(HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)]);
    setNewHabitIcon(HABIT_ICONS[0]);
    setShowAddHabit(false);
  };

  const startEdit = (h: { id: string; name: string; color: string; icon: string }) => {
    setEditingHabit(h.id);
    setEditName(h.name);
    setEditColor(h.color);
    setEditIcon(h.icon);
  };

  const saveEdit = async () => {
    if (editingHabit && editName.trim()) {
      await updateHabit(editingHabit, editName.trim(), editColor, editIcon);
      setEditingHabit(null);
    }
  };

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  })();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold">Productivity Tracker</h1>
        <p className="mt-1 text-muted-foreground">Build consistency. Track progress. Achieve goals.</p>
      </motion.div>

      {/* Dashboard Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Tasks", value: totalHabits, icon: Target, color: "text-blue-500" },
          { label: "Done Today", value: completedToday, icon: Check, color: "text-green-500" },
          { label: "Today's Progress", value: `${completionPct}%`, icon: TrendingUp, color: "text-amber-500" },
          { label: "Month", value: getMonthName(currentMonth), icon: BarChart3, color: "text-purple-500" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progress Bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Today&apos;s Completion</span>
              <span className="text-sm font-bold text-primary">{completionPct}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Month Navigator */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">
          {getMonthName(currentMonth)} {currentYear}
        </h2>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        {[
          { key: "tracker" as const, label: "Tracker", icon: Target },
          { key: "analytics" as const, label: "Analytics", icon: BarChart3 },
          { key: "mood" as const, label: "Mood & Energy", icon: Smile },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "tracker" && (
          <motion.div
            key="tracker"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            {/* Add Habit Button */}
            <div className="mb-4 flex justify-end">
              <Button onClick={() => setShowAddHabit(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>

            {/* Add Habit Modal */}
            <AnimatePresence>
              {showAddHabit && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                  onClick={(e) => { if (e.target === e.currentTarget) setShowAddHabit(false); }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>New Task</CardTitle>
                        <CardDescription>Add a new task to track daily.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Input
                          placeholder="Task name (e.g. Read 30 min)"
                          value={newHabitName}
                          onChange={(e) => setNewHabitName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleAddHabit(); }}
                        />
                        {/* Icon picker */}
                        <div>
                          <p className="text-sm font-medium mb-2">Icon</p>
                          <div className="flex flex-wrap gap-2">
                            {HABIT_ICONS.map((icon) => (
                              <button
                                key={icon}
                                onClick={() => setNewHabitIcon(icon)}
                                className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all ${
                                  newHabitIcon === icon
                                    ? "bg-primary/20 ring-2 ring-primary scale-110"
                                    : "bg-muted hover:bg-muted/80"
                                }`}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Color picker */}
                        <div>
                          <p className="text-sm font-medium mb-2">Color</p>
                          <div className="flex flex-wrap gap-2">
                            {HABIT_COLORS.map((color) => (
                              <button
                                key={color}
                                onClick={() => setNewHabitColor(color)}
                                className={`h-8 w-8 rounded-full transition-all ${
                                  newHabitColor === color ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setShowAddHabit(false)} className="flex-1">
                            Cancel
                          </Button>
                          <Button onClick={handleAddHabit} disabled={!newHabitName.trim()} className="flex-1">
                            Add Task
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Edit Habit Modal */}
            <AnimatePresence>
              {editingHabit && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                  onClick={(e) => { if (e.target === e.currentTarget) setEditingHabit(null); }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Edit Task</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                        <div>
                          <p className="text-sm font-medium mb-2">Icon</p>
                          <div className="flex flex-wrap gap-2">
                            {HABIT_ICONS.map((icon) => (
                              <button
                                key={icon}
                                onClick={() => setEditIcon(icon)}
                                className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all ${
                                  editIcon === icon
                                    ? "bg-primary/20 ring-2 ring-primary scale-110"
                                    : "bg-muted hover:bg-muted/80"
                                }`}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Color</p>
                          <div className="flex flex-wrap gap-2">
                            {HABIT_COLORS.map((color) => (
                              <button
                                key={color}
                                onClick={() => setEditColor(color)}
                                className={`h-8 w-8 rounded-full transition-all ${
                                  editColor === color ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setEditingHabit(null)} className="flex-1">
                            Cancel
                          </Button>
                          <Button onClick={saveEdit} className="flex-1">
                            Save
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <Skeleton className="h-[500px] rounded-lg" />
            ) : habits.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Target className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No tasks yet</h3>
                  <p className="mt-1 text-muted-foreground">Add your first task to start tracking!</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="overflow-x-auto">
                    <div className="min-w-[900px]">
                      {/* Header: Day numbers with week dividers */}
                      <div className="mb-1 grid gap-0.5" style={{ gridTemplateColumns: `180px repeat(${daysInMonth}, 1fr) 80px 60px` }}>
                        <div className="px-2 text-xs font-semibold text-muted-foreground flex items-center">My Tasks</div>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const dayNum = i + 1;
                          const weekBorder = dayNum > 1 && getWeekNumber(dayNum) !== getWeekNumber(dayNum - 1);
                          const isToday =
                            currentYear === new Date().getFullYear() &&
                            currentMonth === new Date().getMonth() &&
                            dayNum === new Date().getDate();
                          return (
                            <div
                              key={dayNum}
                              className={`flex items-center justify-center text-[10px] font-medium ${
                                isToday ? "text-primary font-bold" : "text-muted-foreground"
                              } ${weekBorder ? "border-l-2 border-primary/20 pl-0.5" : ""}`}
                            >
                              {dayNum}
                            </div>
                          );
                        })}
                        <div className="text-[10px] font-semibold text-center text-muted-foreground flex items-center justify-center">Done</div>
                        <div className="text-[10px] font-semibold text-center text-muted-foreground flex items-center justify-center">%</div>
                      </div>

                      {/* Week labels row */}
                      <div className="mb-2 grid gap-0.5" style={{ gridTemplateColumns: `180px repeat(${daysInMonth}, 1fr) 80px 60px` }}>
                        <div />
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const dayNum = i + 1;
                          const isFirstOfWeek = dayNum === 1 || dayNum === 8 || dayNum === 15 || dayNum === 22 || dayNum === 29;
                          return (
                            <div key={dayNum} className="text-[8px] text-center text-muted-foreground/60">
                              {isFirstOfWeek ? `W${getWeekNumber(dayNum)}` : ""}
                            </div>
                          );
                        })}
                        <div />
                        <div />
                      </div>

                      {/* Habit rows */}
                      {habits.map((habit, idx) => {
                        const stats = getHabitStats(habit.id);
                        return (
                          <motion.div
                            key={habit.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="mb-0.5 grid gap-0.5 group"
                            style={{ gridTemplateColumns: `180px repeat(${daysInMonth}, 1fr) 80px 60px` }}
                          >
                            {/* Habit name */}
                            <div className="flex items-center gap-2 px-2 py-1 rounded-l-md" style={{ borderLeft: `3px solid ${habit.color}` }}>
                              <span className="text-base">{habit.icon}</span>
                              <span className="text-xs font-medium truncate flex-1">{habit.name}</span>
                              <button
                                onClick={() => startEdit(habit)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                              >
                                <Edit3 className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => deleteHabit(habit.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </button>
                            </div>

                            {/* Day checkboxes */}
                            {Array.from({ length: daysInMonth }, (_, i) => {
                              const dayNum = i + 1;
                              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                              const done = isCompleted(habit.id, dateStr);
                              const weekBorder = dayNum > 1 && getWeekNumber(dayNum) !== getWeekNumber(dayNum - 1);
                              const isFuture = new Date(dateStr) > new Date(todayStr);

                              return (
                                <button
                                  key={dayNum}
                                  onClick={() => !isFuture && toggleEntry(habit.id, dateStr)}
                                  disabled={isFuture}
                                  className={`flex h-7 items-center justify-center rounded-sm transition-all ${
                                    weekBorder ? "border-l-2 border-primary/20" : ""
                                  } ${
                                    isFuture
                                      ? "cursor-not-allowed opacity-30 bg-muted"
                                      : done
                                      ? "cursor-pointer"
                                      : "cursor-pointer bg-muted hover:bg-muted/60"
                                  }`}
                                  style={done ? { backgroundColor: habit.color + "30" } : undefined}
                                  title={`${dateStr}${done ? " ✓" : ""}`}
                                >
                                  {done && (
                                    <Check className="h-3.5 w-3.5" style={{ color: habit.color }} />
                                  )}
                                </button>
                              );
                            })}

                            {/* Stats */}
                            <div className="flex items-center justify-center">
                              <span className="text-xs font-semibold" style={{ color: habit.color }}>
                                {stats.completedDays}/{stats.activeDays}
                              </span>
                            </div>
                            <div className="flex items-center justify-center">
                              <span className={`text-xs font-bold ${stats.percentage >= 80 ? "text-green-500" : stats.percentage >= 50 ? "text-amber-500" : "text-red-500"}`}>
                                {stats.percentage}%
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}

                      {/* Bottom progress row */}
                      <div className="mt-3 pt-3 border-t grid gap-0.5" style={{ gridTemplateColumns: `180px repeat(${daysInMonth}, 1fr) 80px 60px` }}>
                        <div className="px-2 text-xs font-semibold text-muted-foreground">Progress</div>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const dayNum = i + 1;
                          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                          const done = habits.filter((h) => isCompleted(h.id, dateStr)).length;
                          const pct = habits.length > 0 ? Math.round((done / habits.length) * 100) : 0;
                          return (
                            <div key={dayNum} className="flex items-center justify-center text-[9px] font-medium text-muted-foreground" title={`${pct}%`}>
                              {pct > 0 ? `${pct}%` : ""}
                            </div>
                          );
                        })}
                        <div />
                        <div />
                      </div>

                      {/* Done / Not Done counts */}
                      <div className="mt-1 grid gap-0.5" style={{ gridTemplateColumns: `180px repeat(${daysInMonth}, 1fr) 80px 60px` }}>
                        <div className="px-2 text-[10px] text-muted-foreground">Done</div>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const dayNum = i + 1;
                          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                          const done = habits.filter((h) => isCompleted(h.id, dateStr)).length;
                          return (
                            <div key={dayNum} className="flex items-center justify-center text-[9px] font-medium text-green-500">
                              {done || ""}
                            </div>
                          );
                        })}
                        <div />
                        <div />
                      </div>
                      <div className="grid gap-0.5" style={{ gridTemplateColumns: `180px repeat(${daysInMonth}, 1fr) 80px 60px` }}>
                        <div className="px-2 text-[10px] text-muted-foreground">Not Done</div>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const dayNum = i + 1;
                          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                          const done = habits.filter((h) => isCompleted(h.id, dateStr)).length;
                          const notDone = habits.length - done;
                          return (
                            <div key={dayNum} className="flex items-center justify-center text-[9px] font-medium text-red-400">
                              {notDone > 0 && done > 0 ? notDone : ""}
                            </div>
                          );
                        })}
                        <div />
                        <div />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            <AnalyticsDashboard
              habits={habits}
              getRankedHabits={getRankedHabits}
              getWeeklyStats={getWeeklyStats}
              getDailyCompletionTrend={getDailyCompletionTrend}
              daysInMonth={daysInMonth}
              currentMonth={currentMonth}
            />
          </motion.div>
        )}

        {activeTab === "mood" && (
          <motion.div
            key="mood"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <MoodTracker
              currentYear={currentYear}
              currentMonth={currentMonth}
              daysInMonth={daysInMonth}
              getMood={getMood}
              saveMood={saveMood}
              todayStr={todayStr}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Analytics Dashboard ─── */

function AnalyticsDashboard({
  habits,
  getRankedHabits,
  getWeeklyStats,
  getDailyCompletionTrend,
  daysInMonth,
  currentMonth,
}: {
  habits: { id: string; name: string; color: string; icon: string }[];
  getRankedHabits: () => { id: string; name: string; color: string; icon: string; stats: { completedDays: number; activeDays: number; percentage: number } }[];
  getWeeklyStats: (habitId: string, week: number) => { count: number; total: number; percentage: number };
  getDailyCompletionTrend: () => { day: number; percentage: number }[];
  daysInMonth: number;
  currentMonth: number;
}) {
  const ranked = getRankedHabits();
  const trend = getDailyCompletionTrend();
  const maxPct = Math.max(...trend.map((t) => t.percentage), 1);
  const weeks = daysInMonth > 28 ? [1, 2, 3, 4, 5] : [1, 2, 3, 4];

  return (
    <>
      {/* Habit Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Task Ranking
          </CardTitle>
          <CardDescription>Most to least consistent tasks this month.</CardDescription>
        </CardHeader>
        <CardContent>
          {ranked.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks to rank yet.</p>
          ) : (
            <div className="space-y-3">
              {ranked.map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold" style={{ color: h.color }}>
                    #{i + 1}
                  </div>
                  <span className="text-lg">{h.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{h.name}</span>
                      <span className="text-sm font-bold" style={{ color: h.color }}>{h.stats.percentage}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${h.stats.percentage}%` }}
                        transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: h.color }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {h.stats.completedDays}/{h.stats.activeDays}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Progress</CardTitle>
          <CardDescription>Completion percentage by week for each task.</CardDescription>
        </CardHeader>
        <CardContent>
          {habits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Add tasks to see weekly stats.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Task</th>
                    {weeks.map((w) => (
                      <th key={w} className="text-center py-2 px-3 font-medium text-muted-foreground">Week {w}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {habits.map((h) => (
                    <tr key={h.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <span className="mr-1">{h.icon}</span>
                        <span className="font-medium">{h.name}</span>
                      </td>
                      {weeks.map((w) => {
                        const ws = getWeeklyStats(h.id, w);
                        return (
                          <td key={w} className="text-center py-2 px-3">
                            <span className={`text-xs font-bold ${ws.percentage >= 80 ? "text-green-500" : ws.percentage >= 50 ? "text-amber-500" : ws.percentage > 0 ? "text-red-400" : "text-muted-foreground"}`}>
                              {ws.percentage}%
                            </span>
                            <span className="block text-[10px] text-muted-foreground">{ws.count}/{ws.total}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Completion Trend Chart (CSS-based) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Daily Completion Trend
          </CardTitle>
          <CardDescription>Overall task completion % per day this month.</CardDescription>
        </CardHeader>
        <CardContent>
          {habits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {/* Y‑axis labels + bars */}
              <div className="flex items-end gap-[2px] h-40">
                {trend.map((t) => (
                  <div key={t.day} className="flex-1 flex flex-col items-center justify-end h-full">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${maxPct > 0 ? (t.percentage / maxPct) * 100 : 0}%` }}
                      transition={{ delay: t.day * 0.02, duration: 0.4 }}
                      className="w-full rounded-t-sm bg-gradient-to-t from-primary to-primary/60 min-h-0"
                      title={`Day ${t.day}: ${t.percentage}%`}
                    />
                  </div>
                ))}
              </div>
              {/* X‑axis labels */}
              <div className="flex gap-[2px]">
                {trend.map((t) => (
                  <div key={t.day} className="flex-1 text-center text-[8px] text-muted-foreground">
                    {t.day % 5 === 1 || t.day === daysInMonth ? t.day : ""}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/* ─── Mood & Energy Tracker ─── */

import type { MoodEntry } from "@/types";

function MoodTracker({
  currentYear,
  currentMonth,
  daysInMonth,
  getMood,
  saveMood,
  todayStr,
}: {
  currentYear: number;
  currentMonth: number;
  daysInMonth: number;
  getMood: (date: string) => MoodEntry | undefined;
  saveMood: (date: string, mood: number, energy: number, motivation: number) => Promise<void>;
  todayStr: string;
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [moodVal, setMoodVal] = useState(7);
  const [energyVal, setEnergyVal] = useState(7);
  const [motivationVal, setMotivationVal] = useState(7);

  const openDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const existing = getMood(dateStr);
    if (existing) {
      setMoodVal(existing.mood);
      setEnergyVal(existing.energy);
      setMotivationVal(existing.motivation);
    } else {
      setMoodVal(7);
      setEnergyVal(7);
      setMotivationVal(7);
    }
    setSelectedDay(day);
  };

  const handleSave = async () => {
    if (selectedDay === null) return;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    await saveMood(dateStr, moodVal, energyVal, motivationVal);
    setSelectedDay(null);
  };

  const moodEmoji = (val: number) => {
    if (val >= 9) return "😄";
    if (val >= 7) return "🙂";
    if (val >= 5) return "😐";
    if (val >= 3) return "😔";
    return "😞";
  };

  return (
    <>
      {/* Mood Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smile className="h-5 w-5 text-yellow-500" />
            Mood & Energy Tracker
          </CardTitle>
          <CardDescription>Click on a day to log your mood, energy, and motivation (1–10).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-28">Metric</th>
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <th key={i + 1} className="text-center py-2 px-0.5 font-medium text-muted-foreground text-[10px] min-w-[24px]">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Mood row */}
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium flex items-center gap-1"><Smile className="h-3.5 w-3.5 text-yellow-500" /> Mood</td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const m = getMood(dateStr);
                    const isFuture = dateStr > todayStr;
                    return (
                      <td key={day} className="text-center py-1 px-0.5">
                        <button
                          onClick={() => !isFuture && openDay(day)}
                          disabled={isFuture}
                          className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${
                            isFuture ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:ring-1 hover:ring-primary"
                          }`}
                          style={m ? { backgroundColor: `hsl(${(m.mood / 10) * 120}, 70%, 85%)`, color: `hsl(${(m.mood / 10) * 120}, 70%, 30%)` } : undefined}
                        >
                          {m ? m.mood : "-"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
                {/* Energy row */}
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-orange-500" /> Energy</td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const m = getMood(dateStr);
                    return (
                      <td key={day} className="text-center py-1 px-0.5">
                        <div
                          className="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center"
                          style={m ? { backgroundColor: `hsl(${(m.energy / 10) * 40 + 10}, 80%, 85%)`, color: `hsl(${(m.energy / 10) * 40 + 10}, 80%, 30%)` } : undefined}
                        >
                          {m ? m.energy : "-"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                {/* Motivation row */}
                <tr>
                  <td className="py-2 pr-4 font-medium flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-red-500" /> Motivation</td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const m = getMood(dateStr);
                    return (
                      <td key={day} className="text-center py-1 px-0.5">
                        <div
                          className="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center"
                          style={m ? { backgroundColor: `hsl(${(m.motivation / 10) * 260 + 200}, 60%, 85%)`, color: `hsl(${(m.motivation / 10) * 260 + 200}, 60%, 30%)` } : undefined}
                        >
                          {m ? m.motivation : "-"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mood mini-chart */}
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Mood Trend</h4>
            <div className="flex items-end gap-[2px] h-24">
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const m = getMood(dateStr);
                const val = m ? m.mood : 0;
                return (
                  <div key={day} className="flex-1 flex flex-col items-center justify-end h-full">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${val * 10}%` }}
                      transition={{ delay: day * 0.02, duration: 0.3 }}
                      className="w-full rounded-t-sm min-h-0"
                      style={{ backgroundColor: val > 0 ? `hsl(${(val / 10) * 120}, 60%, 60%)` : "transparent" }}
                      title={`Day ${day}: ${val || "—"}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-[2px] mt-1">
              {Array.from({ length: daysInMonth }, (_, i) => (
                <div key={i + 1} className="flex-1 text-center text-[7px] text-muted-foreground">
                  {(i + 1) % 5 === 1 ? i + 1 : ""}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Mood Modal */}
      <AnimatePresence>
        {selectedDay !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedDay(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {moodEmoji(moodVal)} Day {selectedDay} — {getMonthName(currentMonth)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Mood */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium flex items-center gap-1"><Smile className="h-4 w-4 text-yellow-500" /> Mood</label>
                      <span className="text-lg font-bold">{moodVal}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={moodVal}
                      onChange={(e) => setMoodVal(Number(e.target.value))}
                      className="w-full accent-yellow-500"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>😞 Low</span><span>😄 High</span></div>
                  </div>
                  {/* Energy */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium flex items-center gap-1"><Zap className="h-4 w-4 text-orange-500" /> Energy</label>
                      <span className="text-lg font-bold">{energyVal}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={energyVal}
                      onChange={(e) => setEnergyVal(Number(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>Low</span><span>High</span></div>
                  </div>
                  {/* Motivation */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium flex items-center gap-1"><Flame className="h-4 w-4 text-red-500" /> Motivation</label>
                      <span className="text-lg font-bold">{motivationVal}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={motivationVal}
                      onChange={(e) => setMotivationVal(Number(e.target.value))}
                      className="w-full accent-red-500"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>Low</span><span>High</span></div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedDay(null)} className="flex-1">Cancel</Button>
                    <Button onClick={handleSave} className="flex-1">Save</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
