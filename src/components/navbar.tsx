"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Bell, LogOut, Menu, X, Briefcase, UserCircle, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { useState, useRef, useEffect } from "react";

export function Navbar() {
  const { user, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">SmartSync</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Link href="/habits">
                <Button variant="ghost" size="sm">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Productivity
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </Button>
              </Link>
              {/* Notification Bell with Dropdown */}
              <div className="relative" ref={notifRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="overflow-visible"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-5 w-5" />
                </Button>
                {unreadCount > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground pointer-events-none"
                  >
                    {unreadCount}
                  </span>
                )}

                {/* Dropdown Panel */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-80 rounded-lg border bg-background shadow-lg z-[100]"
                    >
                      <div className="flex items-center justify-between border-b px-4 py-3">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead()}
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <Bell className="h-6 w-6 mb-2" />
                            <span className="text-sm">No notifications</span>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => {
                                if (!n.read) markAsRead(n.id);
                                if (n.group_id) {
                                  router.push(`/groups/${n.group_id}`);
                                  setShowNotifications(false);
                                }
                              }}
                              className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors hover:bg-muted/50 ${
                                !n.read ? "bg-primary/5" : ""
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {!n.read && (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm leading-snug">{n.message}</p>
                                  <p className="text-[11px] text-muted-foreground mt-1">
                                    {timeAgo(n.created_at)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link href="/login">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t md:hidden"
        >
          <div className="flex flex-col gap-2 p-4">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                </Link>
                <Link href="/habits" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Productivity
                  </Button>
                </Link>
                <Link href="/profile" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { signOut(); setMobileOpen(false); }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">Get Started</Button>
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
