"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Meeting } from "@/types";

export function useMeetings(groupId: string) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchMeeting = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("meetings")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) setMeeting(data);
    setLoading(false);
  }, [groupId, supabase]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  const scheduleMeeting = async (
    day: string,
    time: string,
    userId: string,
    memberIds: string[],
    groupName: string
  ) => {
    const { data, error } = await supabase
      .from("meetings")
      .insert({
        group_id: groupId,
        scheduled_day: day,
        scheduled_time: time,
        created_by: userId,
      })
      .select()
      .single();

    if (error) return null;

    // Notify all members
    const notifications = memberIds
      .filter((id) => id !== userId)
      .map((memberId) => ({
        user_id: memberId,
        type: "meeting_scheduled" as const,
        message: `Meeting scheduled for ${groupName}: ${day} at ${time}`,
        group_id: groupId,
      }));

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    await fetchMeeting();
    return data;
  };

  const updateMeetLink = async (meetLink: string | null) => {
    if (!meeting) return;
    const { error } = await supabase
      .from("meetings")
      .update({ meet_link: meetLink })
      .eq("id", meeting.id);
    if (!error) {
      setMeeting((prev) => (prev ? { ...prev, meet_link: meetLink } : prev));
    }
    return error;
  };

  return { meeting, loading, scheduleMeeting, updateMeetLink, refetch: fetchMeeting };
}
