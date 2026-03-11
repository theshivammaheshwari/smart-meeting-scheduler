"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Announcement } from "@/types";

export function useAnnouncements(groupId: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("group_announcements")
      .select("*, user:users(id, email, full_name, avatar_url)")
      .eq("group_id", groupId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (data) {
      setAnnouncements(
        data.map((a: Record<string, unknown>) => ({
          ...a,
          user: a.user as Announcement["user"],
        })) as Announcement[]
      );
    }
    setLoading(false);
  }, [groupId, supabase]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const createAnnouncement = async (
    userId: string,
    title: string,
    content: string,
    pinned: boolean = false
  ) => {
    const { error } = await supabase.from("group_announcements").insert({
      group_id: groupId,
      user_id: userId,
      title: title.trim(),
      content: content.trim(),
      pinned,
    });
    if (!error) await fetchAnnouncements();
    return error;
  };

  const togglePin = async (announcementId: string, currentPinned: boolean) => {
    const { error } = await supabase
      .from("group_announcements")
      .update({ pinned: !currentPinned })
      .eq("id", announcementId);
    if (!error) await fetchAnnouncements();
    return error;
  };

  const deleteAnnouncement = async (announcementId: string) => {
    const { error } = await supabase
      .from("group_announcements")
      .delete()
      .eq("id", announcementId);
    if (!error) await fetchAnnouncements();
    return error;
  };

  return { announcements, loading, createAnnouncement, togglePin, deleteAnnouncement };
}
