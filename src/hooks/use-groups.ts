"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Group, GroupMember, User } from "@/types";

export function useGroups(userId: string | undefined) {
  const [groups, setGroups] = useState<(Group & { member_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchGroups = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: memberships, error: memErr } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (memErr) {
      console.error("fetchGroups memberships error:", memErr.message);
      setLoading(false);
      return;
    }

    if (!memberships?.length) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupIds = memberships.map((m) => m.group_id);

    const { data: groupsData, error: grpErr } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds)
      .order("created_at", { ascending: false });

    if (grpErr) {
      console.error("fetchGroups groups error:", grpErr.message);
      setLoading(false);
      return;
    }

    if (groupsData) {
      const groupsWithCount = await Promise.all(
        groupsData.map(async (group) => {
          const { count } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id);
          return { ...group, member_count: count ?? 0 };
        })
      );
      setGroups(groupsWithCount);
    }

    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (name: string, description?: string, slotDuration: number = 30, availabilityDeadline?: string) => {
    if (!userId) return null;

    const { data: groupId, error } = await supabase.rpc("create_group_with_admin", {
      group_name: name,
      group_description: description || null,
      group_slot_duration: slotDuration,
      group_availability_deadline: availabilityDeadline || null,
    });

    if (error) {
      console.error("Failed to create group:", error.message);
      return null;
    }

    await fetchGroups();
    return { id: groupId, name, description, slot_duration: slotDuration, availability_deadline: availabilityDeadline || null, created_by: userId };
  };

  const deleteGroup = async (groupId: string) => {
    await supabase.from("groups").delete().eq("id", groupId);
    await fetchGroups();
  };

  return { groups, loading, createGroup, deleteGroup, refetch: fetchGroups };
}

export function useGroupDetails(groupId: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<(GroupMember & { users: User })[]>([]);
  const [userRole, setUserRole] = useState<"admin" | "member" | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchDetails = useCallback(async () => {
    setLoading(true);

    const { data: groupData } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (groupData) setGroup(groupData);

    const { data: membersData } = await supabase
      .from("group_members")
      .select("*, users(*)")
      .eq("group_id", groupId);

    if (membersData) {
      setMembers(membersData as (GroupMember & { users: User })[]);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const currentMember = membersData.find((m) => m.user_id === user.id);
        setUserRole(currentMember?.role ?? null);
      }
    }

    setLoading(false);
  }, [groupId, supabase]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { group, members, userRole, loading, refetch: fetchDetails };
}
