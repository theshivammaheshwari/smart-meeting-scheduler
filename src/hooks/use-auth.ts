"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { detectTimezone } from "@/lib/timezones";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userTimezone, setUserTimezone] = useState("UTC");
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);

      if (user) {
        // Fetch saved timezone
        const { data: profile } = await supabase
          .from("users")
          .select("timezone")
          .eq("id", user.id)
          .single();

        if (profile?.timezone) {
          setUserTimezone(profile.timezone);
        } else {
          // Auto-detect and save
          const detected = detectTimezone();
          setUserTimezone(detected);
          await supabase
            .from("users")
            .update({ timezone: detected })
            .eq("id", user.id);
        }
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, supabase]);

  const updateTimezone = async (tz: string) => {
    setUserTimezone(tz);
    if (user) {
      await supabase
        .from("users")
        .update({ timezone: tz })
        .eq("id", user.id);
    }
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  return { user, loading, userTimezone, updateTimezone, signInWithGoogle, signOut };
}
