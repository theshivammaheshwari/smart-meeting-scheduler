"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GroupMessage } from "@/types";

export function useGroupChat(groupId: string) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("group_messages")
      .select("*, user:users(id, email, full_name, avatar_url)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(
        data.map((msg: Record<string, unknown>) => ({
          ...msg,
          user: msg.user as GroupMessage["user"],
        })) as GroupMessage[]
      );
    }
    setLoading(false);
  }, [groupId, supabase]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Fetch the user info for the new message
          const { data: userData } = await supabase
            .from("users")
            .select("*")
            .eq("id", (payload.new as { user_id: string }).user_id)
            .single();

          const newMsg: GroupMessage = {
            ...(payload.new as GroupMessage),
            user: userData || undefined,
          };

          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, supabase]);

  const sendMessage = async (userId: string, message: string) => {
    const { error } = await supabase.from("group_messages").insert({
      group_id: groupId,
      user_id: userId,
      message: message.trim(),
    });
    return error;
  };

  return { messages, loading, sendMessage };
}
