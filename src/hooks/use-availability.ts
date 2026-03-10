"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Availability, RecommendedSlot } from "@/types";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Generate timeslots based on duration (in minutes)
export function generateTimeslots(durationMinutes: number = 30): string[] {
  const slots: string[] = [];
  const startHour = 8; // 8 AM
  const endHour = 21;  // 9 PM
  const totalMinutes = (endHour - startHour) * 60;

  for (let m = 0; m <= totalMinutes - durationMinutes; m += durationMinutes) {
    const hour = startHour + Math.floor(m / 60);
    const minute = m % 60;
    slots.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
  }
  return slots;
}

// Default 30-min slots for backward compatibility
export const TIMESLOTS = generateTimeslots(30);

export function useAvailability(groupId: string, userId: string | undefined) {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [allAvailability, setAllAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchAvailability = useCallback(async () => {
    setLoading(true);

    // Fetch current user's availability
    if (userId) {
      const { data: userAvail } = await supabase
        .from("availability")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (userAvail) setAvailability(userAvail);
    }

    // Fetch all members' availability
    const { data: allAvail } = await supabase
      .from("availability")
      .select("*")
      .eq("group_id", groupId);

    if (allAvail) setAllAvailability(allAvail);

    setLoading(false);
  }, [groupId, userId, supabase]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const toggleSlot = async (day: string, timeslot: string) => {
    if (!userId) return;

    const existing = availability.find(
      (a) => a.day === day && a.timeslot === timeslot
    );

    if (existing) {
      await supabase.from("availability").delete().eq("id", existing.id);
    } else {
      await supabase.from("availability").insert({
        group_id: groupId,
        user_id: userId,
        day,
        timeslot,
      });
    }

    await fetchAvailability();
  };

  const isSelected = (day: string, timeslot: string): boolean => {
    return availability.some((a) => a.day === day && a.timeslot === timeslot);
  };

  const getSlotCount = (day: string, timeslot: string): number => {
    return allAvailability.filter((a) => a.day === day && a.timeslot === timeslot).length;
  };

  return {
    availability,
    allAvailability,
    loading,
    toggleSlot,
    isSelected,
    getSlotCount,
    refetch: fetchAvailability,
  };
}

export function findBestSlots(
  allAvailability: Availability[],
  totalMembers: number
): RecommendedSlot[] {
  const slotMap = new Map<string, { count: number; members: Set<string> }>();

  for (const avail of allAvailability) {
    const key = `${avail.day}|${avail.timeslot}`;
    if (!slotMap.has(key)) {
      slotMap.set(key, { count: 0, members: new Set() });
    }
    const slot = slotMap.get(key)!;
    slot.count++;
    slot.members.add(avail.user_id);
  }

  const recommended: RecommendedSlot[] = Array.from(slotMap.entries())
    .map(([key, value]) => {
      const [day, timeslot] = key.split("|");
      return {
        day,
        timeslot,
        count: value.count,
        percentage: totalMembers > 0 ? Math.round((value.count / totalMembers) * 100) : 0,
        members: Array.from(value.members),
      };
    })
    .sort((a, b) => b.count - a.count);

  return recommended;
}
