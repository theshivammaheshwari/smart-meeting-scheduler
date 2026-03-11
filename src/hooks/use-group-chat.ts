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

  const sendMessage = async (userId: string, message: string, fileUrl?: string, fileType?: string) => {
    const { error } = await supabase.from("group_messages").insert({
      group_id: groupId,
      user_id: userId,
      message: message.trim() || (fileUrl ? "Shared a file" : ""),
      file_url: fileUrl || null,
      file_type: fileType || null,
    });
    return error;
  };

  const uploadFile = async (file: File): Promise<{ url: string; type: string } | null> => {
    if (file.size > 5 * 1024 * 1024) {
      alert("File must be under 5MB.");
      return null;
    }

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      alert("Only images (JPG, PNG, GIF, WebP) and PDFs are allowed.");
      return null;
    }

    const ext = file.name.split(".").pop();
    const path = `${groupId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("chat-files")
      .upload(path, file);

    if (error) {
      console.error("File upload error:", error);
      alert("File upload failed: " + error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("chat-files")
      .getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      type: file.type.startsWith("image/") ? "image" : "pdf",
    };
  };

  return { messages, loading, sendMessage, uploadFile };
}
