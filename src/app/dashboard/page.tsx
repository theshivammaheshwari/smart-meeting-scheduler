"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Users,
  Calendar,
  Bell,
  Trash2,
  ChevronRight,
  Clock,
  CheckCircle,
  BookUser,
  MessageCircle,
  Send,
  X,
  Globe,
  KeyRound,
  Copy,
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
import { useGroups } from "@/hooks/use-groups";
import { useNotifications } from "@/hooks/use-notifications";
import { createClient } from "@/lib/supabase/client";
import { TIMEZONE_OPTIONS, getTimezoneAbbr } from "@/lib/timezones";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export default function DashboardPage() {
  const { user, loading: authLoading, userTimezone, updateTimezone } = useAuth();
  const { groups, loading: groupsLoading, createGroup, deleteGroup, refetch: refetchGroups } = useGroups(user?.id);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newSlotDuration, setNewSlotDuration] = useState(30);
  const [newDeadline, setNewDeadline] = useState("");
  const [creating, setCreating] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<"groups" | "contacts">("groups");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [showTzPicker, setShowTzPicker] = useState(false);
  const [tzSearch, setTzSearch] = useState("");

  const supabaseRef = useRef(createClient());
  const supabaseDash = supabaseRef.current;

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    setCreating(true);
    await createGroup(newGroupName.trim(), newGroupDesc.trim() || undefined, newSlotDuration, newDeadline || undefined);
    setNewGroupName("");
    setNewGroupDesc("");
    setNewSlotDuration(30);
    setNewDeadline("");
    setShowCreate(false);
    setCreating(false);
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError("");

    const { error } = await supabaseDash.rpc("join_group_by_code", {
      code: joinCode.trim(),
    });

    if (error) {
      setJoinError(error.message);
      setJoining(false);
      return;
    }

    setJoinCode("");
    setShowJoinModal(false);
    setJoining(false);
    refetchGroups();
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="mb-8 h-10 w-64" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : ""}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your groups and schedule meetings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Timezone selector */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTzPicker(!showTzPicker)}
              className="gap-1"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{getTimezoneAbbr(userTimezone)}</span>
            </Button>
            {showTzPicker && (
              <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border bg-background shadow-lg">
                <div className="p-2">
                  <Input
                    placeholder="Search timezone..."
                    value={tzSearch}
                    onChange={(e) => setTzSearch(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                  {TIMEZONE_OPTIONS
                    .filter((tz) =>
                      tz.label.toLowerCase().includes(tzSearch.toLowerCase()) ||
                      tz.value.toLowerCase().includes(tzSearch.toLowerCase())
                    )
                    .map((tz) => (
                      <button
                        key={tz.value}
                        onClick={() => {
                          updateTimezone(tz.value);
                          setShowTzPicker(false);
                          setTzSearch("");
                        }}
                        className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                          userTimezone === tz.value
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        {tz.label}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="mr-2 h-4 w-4" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2">{unreadCount}</Badge>
            )}
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Group
          </Button>
          <Button variant="outline" onClick={() => setShowJoinModal(true)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Join
          </Button>
        </div>
      </motion.div>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark all as read
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notifications yet.</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                          n.read ? "bg-background" : "bg-primary/5"
                        }`}
                        onClick={() => !n.read && markAsRead(n.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && !n.read && markAsRead(n.id)}
                      >
                        <div className="mt-0.5">
                          {n.type === "invite" && <Users className="h-4 w-4 text-primary" />}
                          {n.type === "meeting_scheduled" && <Calendar className="h-4 w-4 text-success" />}
                          {n.type === "availability_updated" && <Clock className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{n.message}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCreate(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Create New Group</CardTitle>
                  <CardDescription>
                    Create a group and invite people to find the best meeting time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Group Name</label>
                    <Input
                      placeholder="e.g., Team Standup, Project Sync"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Description (optional)</label>
                    <Input
                      placeholder="What is this group for?"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Time Slot Duration</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 30, label: "30 min" },
                        { value: 60, label: "1 hour" },
                        { value: 90, label: "1.5 hr" },
                        { value: 120, label: "2 hours" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNewSlotDuration(opt.value)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            newSlotDuration === opt.value
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background hover:bg-muted"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Availability Deadline (optional)</label>
                    <Input
                      type="datetime-local"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Members can&apos;t change availability after this time.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={creating || !newGroupName.trim()} className="flex-1">
                      {creating ? "Creating..." : "Create Group"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Group Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) { setShowJoinModal(false); setJoinError(""); }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Join Group</CardTitle>
                  <CardDescription>
                    Enter the passcode shared by the group admin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Enter 6-digit code"
                    value={joinCode}
                    onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
                    maxLength={6}
                    className="text-center text-lg font-mono tracking-widest"
                  />
                  {joinError && (
                    <p className="text-sm text-destructive">{joinError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setShowJoinModal(false); setJoinCode(""); setJoinError(""); }} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleJoinByCode} disabled={joining || !joinCode.trim()} className="flex-1">
                      {joining ? "Joining..." : "Join Group"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        {[
          { key: "groups" as const, label: "My Groups", icon: Users },
          { key: "contacts" as const, label: "Contacts", icon: BookUser },
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
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "groups" && (
        <>
      {/* Groups Grid */}
      {groupsLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">No groups yet</h2>
          <p className="mt-2 text-muted-foreground">
            Create your first group to start scheduling meetings.
          </p>
          <Button className="mt-6" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Group
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {groups.map((group, i) => (
              <motion.div
                key={group.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={i}
                layout
              >
                <Card className="group relative h-full transition-shadow hover:shadow-lg">
                  <Link href={`/groups/${group.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          {group.description && (
                            <CardDescription className="mt-1">
                              {group.description}
                            </CardDescription>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(group.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                  {group.created_by === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm("Delete this group?")) deleteGroup(group.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pending Invites Section */}
      <PendingInvites userId={user?.id} />
        </>
      )}

      {activeTab === "contacts" && (
        <ContactsTab userId={user?.id} />
      )}
    </div>
  );
}

function PendingInvites({ userId }: { userId: string | undefined }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [invites, setInvites] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase.rpc("get_pending_invites");
      if (data) setInvites(data);
    })();
  }, [userId, supabase]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acceptInvite = async (invite: any) => {
    await supabase
      .from("group_members")
      .insert({ group_id: invite.group_id, user_id: userId, role: "member" });

    await supabase
      .from("invites")
      .update({ status: "accepted" })
      .eq("id", invite.invite_id);

    setInvites((prev) => prev.filter((i) => i.invite_id !== invite.invite_id));
    // Reload page to refresh groups list
    window.location.reload();
  };

  if (invites.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-10"
    >
      <h2 className="mb-4 text-xl font-semibold">Pending Invitations</h2>
      <div className="space-y-3">
        {invites.map((invite) => {
          const groupName = invite.group_name ?? "Unknown Group";
          const inviterName = invite.inviter_name || invite.inviter_email || "Someone";
          return (
            <Card key={invite.invite_id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{groupName}</p>
                    <p className="text-sm text-muted-foreground">Invited by {inviterName}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => acceptInvite(invite)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}

function ContactsTab({ userId }: { userId: string | undefined }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contacts, setContacts] = useState<any[]>([]);
  const [chatContact, setChatContact] = useState<{ id: string; name: string; email: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch contacts
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from("contacts")
        .select("id, name, email, created_at")
        .eq("user_id", userId)
        .order("name", { ascending: true });
      if (data) setContacts(data);
    })();
  }, [userId, supabase]);

  // Fetch messages when a chat is opened
  useEffect(() => {
    if (!userId || !chatContact) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${chatContact.id}),and(sender_id.eq.${chatContact.id},receiver_id.eq.${userId})`
        )
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    // Realtime subscription for new messages
    const channel = supabase
      .channel(`chat-${chatContact.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new;
          if (
            (msg.sender_id === userId && msg.receiver_id === chatContact.id) ||
            (msg.sender_id === chatContact.id && msg.receiver_id === userId)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, chatContact, supabase]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openChat = async (contact: { name: string; email: string }) => {
    // Look up the user id for this contact email
    const { data: contactUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", contact.email)
      .single();

    if (!contactUser) {
      alert(`${contact.email} hasn't signed up yet. Chat is only available for registered users.`);
      return;
    }

    setChatContact({ id: contactUser.id, name: contact.name, email: contact.email });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || !chatContact) return;
    setSending(true);
    await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: chatContact.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
    setSending(false);
  };

  const deleteContact = async (contactId: string) => {
    await supabase.from("contacts").delete().eq("id", contactId);
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  };

  if (contacts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <BookUser className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">No contacts yet</h2>
        <p className="mt-2 text-muted-foreground">
          Contacts are added automatically when you invite someone to a group.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
      {/* Contacts List */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Your Contacts</h2>
        <div className="space-y-2">
          {contacts.map((contact, i) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className={`cursor-pointer transition-shadow hover:shadow-md ${
                  chatContact?.email === contact.email ? "ring-2 ring-primary" : ""
                }`}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div
                    className="flex items-center gap-3 flex-1"
                    onClick={() => openChat(contact)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && openChat(contact)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-semibold text-primary">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openChat(contact)}
                      title="Chat"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Remove ${contact.name} from contacts?`)) deleteContact(contact.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      <div>
        {chatContact ? (
          <Card className="flex flex-col h-[500px]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-semibold text-primary">
                    {chatContact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-base">{chatContact.name}</CardTitle>
                  <CardDescription className="text-xs">{chatContact.email}</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setChatContact(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 pb-0">
              {messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground mt-8">
                  No messages yet. Say hi!
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === userId ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      msg.sender_id === userId
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${
                      msg.sender_id === userId ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={sending}
                />
                <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-[500px]">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="mx-auto mb-3 h-12 w-12" />
              <p className="font-medium">Select a contact to chat</p>
              <p className="text-sm mt-1">Click on any contact to start chatting</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
