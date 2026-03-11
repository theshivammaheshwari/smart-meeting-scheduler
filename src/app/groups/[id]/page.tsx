"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Mail,
  Crown,
  Calendar,
  Clock,
  CheckCircle,
  Trophy,
  Send,
  X,
  Plus,
  BookUser,
  Share2,
  Copy,
  Check,
  Globe,
  Video,
  MessageCircle,
  Link2,
  Trash2,
  Paperclip,
  FileText,
  Pin,
  Megaphone,
  Download,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useGroupDetails } from "@/hooks/use-groups";
import {
  useAvailability,
  findBestSlots,
  DAYS,
  generateTimeslots,
} from "@/hooks/use-availability";
import { useMeetings } from "@/hooks/use-meetings";
import { useGroupChat } from "@/hooks/use-group-chat";
import { useAnnouncements } from "@/hooks/use-announcements";
import { createClient } from "@/lib/supabase/client";
import { getTimezoneAbbr } from "@/lib/timezones";
import Link from "next/link";

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const { user } = useAuth();
  const { group, members, userRole, loading: groupLoading, refetch: refetchGroup } = useGroupDetails(groupId);
  const {
    allAvailability,
    loading: availLoading,
    toggleSlot,
    selectAllDay,
    clearAllDay,
    isSelected,
    getSlotCount,
    refetch: refetchAvail,
  } = useAvailability(groupId, user?.id);
  const { meeting, scheduleMeeting, updateMeetLink } = useMeetings(groupId);
  const { messages: chatMessages, loading: chatLoading, sendMessage, uploadFile } = useGroupChat(groupId);
  const { announcements, loading: announcementsLoading, createAnnouncement, togglePin, deleteAnnouncement } = useAnnouncements(groupId);

  const [activeTab, setActiveTab] = useState<"availability" | "members" | "results" | "chat" | "announcements">("availability");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [contacts, setContacts] = useState<{ name: string; email: string }[]>([]);
  const [showContacts, setShowContacts] = useState(false);
  const [showShareCode, setShowShareCode] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [meetLinkInput, setMeetLinkInput] = useState("");
  const [showMeetLinkEdit, setShowMeetLinkEdit] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Load contacts
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("contacts")
        .select("name, email")
        .eq("user_id", user.id)
        .order("name", { ascending: true });
      if (data) setContacts(data);
    })();
  }, [user, supabase]);

  const addEmailToList = () => {
    const email = currentEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    if (inviteEmails.includes(email)) return;
    // Check if already a member
    if (members.find((m) => m.users?.email === email)) {
      alert(`${email} is already a member.`);
      return;
    }
    setInviteEmails((prev) => [...prev, email]);
    setCurrentEmail("");
  };

  const removeEmailFromList = (email: string) => {
    setInviteEmails((prev) => prev.filter((e) => e !== email));
  };

  const addContactToList = (email: string) => {
    const lowerEmail = email.toLowerCase();
    if (inviteEmails.includes(lowerEmail)) return;
    if (members.find((m) => m.users?.email === lowerEmail)) return;
    setInviteEmails((prev) => [...prev, lowerEmail]);
  };

  const handleBulkInvite = async () => {
    if (inviteEmails.length === 0 || !user) return;
    setInviting(true);

    for (const email of inviteEmails) {
      // Insert invite
      await supabase.from("invites").insert({
        group_id: groupId,
        email,
        invited_by: user.id,
      });

      // Save to contacts (upsert)
      await supabase.from("contacts").upsert(
        { user_id: user.id, email, name: email.split("@")[0] },
        { onConflict: "user_id,email" }
      );

      // Notify if user exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
        await supabase.from("notifications").insert({
          user_id: existingUser.id,
          type: "invite",
          message: `You were invited to ${group?.name}. Go to Dashboard to accept.`,
          group_id: groupId,
        });
      }
    }

    // Refresh contacts
    const { data: newContacts } = await supabase
      .from("contacts")
      .select("name, email")
      .eq("user_id", user.id)
      .order("name", { ascending: true });
    if (newContacts) setContacts(newContacts);

    // Send email notifications (fire-and-forget)
    fetch("/api/email/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emails: inviteEmails,
        groupName: group?.name || "a group",
        inviterName: user.user_metadata?.full_name || user.email || "Someone",
      }),
    }).catch(() => {});

    setInviteEmails([]);
    setInviting(false);
    setShowInvite(false);
    refetchGroup();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", memberId);
    refetchGroup();
    refetchAvail();
  };

  const recommendedSlots = findBestSlots(allAvailability, members.length);
  const topSlots = recommendedSlots.slice(0, 5);

  const deadlinePassed = group?.availability_deadline
    ? new Date(group.availability_deadline) < new Date()
    : false;

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    const { data, error } = await supabase.rpc("generate_join_code", {
      target_group_id: groupId,
    });
    if (error) {
      console.error("Generate code error:", error);
      alert("Error: " + error.message);
      setGeneratingCode(false);
      return;
    }
    if (data) {
      setShareCode(data);
      refetchGroup();
    }
    setGeneratingCode(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSchedule = async (day: string, timeslot: string) => {
    if (!user || !group) return;
    const memberIds = members.map((m) => m.user_id);
    await scheduleMeeting(day, timeslot, user.id, memberIds, group.name);

    // Send email to all members
    const memberEmails = members
      .filter((m) => m.user_id !== user.id)
      .map((m) => m.users?.email)
      .filter(Boolean);
    if (memberEmails.length > 0) {
      fetch("/api/email/meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: memberEmails,
          groupName: group.name,
          day: timeslot ? day : day,
          time: timeslot,
        }),
      }).catch(() => {});
    }
  };

  if (groupLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-8 h-4 w-96" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Group not found</h2>
          <p className="mt-2 text-muted-foreground">This group doesn&apos;t exist or you don&apos;t have access.</p>
          <Link href="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
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
        className="mb-8"
      >
        <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            {group.description && (
              <p className="mt-1 text-muted-foreground">{group.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {userRole === "admin" && (
              <>
                <Button variant="outline" onClick={() => setShowInvite(true)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Invite
                </Button>
                <Button variant="outline" onClick={() => { setShowShareCode(true); setShareCode(group.join_code || null); }}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Code
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Confirmed Meeting Banner */}
      {meeting && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Meeting Confirmed!</h3>
                  <p className="text-muted-foreground">
                    {meeting.scheduled_day} at {meeting.scheduled_time}
                  </p>
                </div>
              </div>

              {/* Meet Link Section */}
              <div className="mt-4 flex flex-col gap-2 border-t border-green-500/20 pt-4">
                {meeting.meet_link ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Video className="h-4 w-4 text-blue-500" />
                    <a
                      href={meeting.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-500 hover:underline break-all"
                    >
                      {meeting.meet_link}
                    </a>
                    {userRole === "admin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setMeetLinkInput(meeting.meet_link || "");
                          setShowMeetLinkEdit(true);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                ) : userRole === "admin" ? (
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">No meeting link yet</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setMeetLinkInput("");
                        setShowMeetLinkEdit(true);
                      }}
                    >
                      <Link2 className="mr-1 h-3 w-3" />
                      Add Link
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">No meeting link added yet</span>
                  </div>
                )}

                {/* Meet Link Edit Inline */}
                {showMeetLinkEdit && (
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="https://meet.google.com/..."
                      value={meetLinkInput}
                      onChange={(e) => setMeetLinkInput(e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={async () => {
                        const link = meetLinkInput.trim();
                        await updateMeetLink(link || null);
                        setShowMeetLinkEdit(false);
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => setShowMeetLinkEdit(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Share Code Modal */}
      <AnimatePresence>
        {showShareCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowShareCode(false);
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
                  <CardTitle>Share Group</CardTitle>
                  <CardDescription>
                    Share this passcode so others can join without an email invite.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {shareCode ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                        <span className="text-3xl font-mono font-bold tracking-[0.3em] text-primary">
                          {shareCode}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => copyCode(shareCode)}
                      >
                        {codeCopied ? (
                          <><Check className="mr-2 h-4 w-4 text-green-500" /> Copied!</>
                        ) : (
                          <><Copy className="mr-2 h-4 w-4" /> Copy Code</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleGenerateCode} disabled={generatingCode} className="w-full">
                      {generatingCode ? "Generating..." : "Generate Passcode"}
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowShareCode(false)} className="w-full">
                    Close
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowInvite(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Invite Members</CardTitle>
                  <CardDescription>
                    Add multiple email addresses to invite. You can also pick from your contacts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Email input */}
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={currentEmail}
                      onChange={(e) => setCurrentEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addEmailToList();
                        }
                      }}
                    />
                    <Button variant="outline" onClick={addEmailToList} type="button">
                      <Plus className="h-4 w-4" />
                    </Button>
                    {contacts.length > 0 && (
                      <Button variant="outline" onClick={() => setShowContacts(!showContacts)} type="button">
                        <BookUser className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Contacts dropdown */}
                  <AnimatePresence>
                    {showContacts && contacts.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="max-h-40 overflow-y-auto rounded-lg border p-2 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground px-2 py-1">Your Contacts</p>
                          {contacts.map((c) => {
                            const alreadyAdded = inviteEmails.includes(c.email.toLowerCase());
                            const isMember = members.find((m) => m.users?.email === c.email);
                            return (
                              <button
                                key={c.email}
                                onClick={() => addContactToList(c.email)}
                                disabled={!!alreadyAdded || !!isMember}
                                className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                                  alreadyAdded || isMember
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-muted cursor-pointer"
                                }`}
                              >
                                <span>{c.name} &lt;{c.email}&gt;</span>
                                {isMember && <Badge variant="secondary" className="text-[10px]">Member</Badge>}
                                {alreadyAdded && !isMember && <Badge variant="outline" className="text-[10px]">Added</Badge>}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email chips */}
                  {inviteEmails.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {inviteEmails.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium"
                        >
                          {email}
                          <button
                            onClick={() => removeEmailFromList(email)}
                            className="ml-1 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setShowInvite(false); setInviteEmails([]); setCurrentEmail(""); }} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleBulkInvite} disabled={inviting || inviteEmails.length === 0} className="flex-1">
                      <Send className="mr-2 h-4 w-4" />
                      {inviting ? "Sending..." : `Invite ${inviteEmails.length} ${inviteEmails.length === 1 ? "person" : "people"}`}
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
          { key: "availability" as const, label: "Availability", icon: Calendar },
          { key: "members" as const, label: "Members", icon: Users },
          { key: "results" as const, label: "Best Times", icon: Trophy },
          { key: "chat" as const, label: "Chat", icon: MessageCircle },
          { key: "announcements" as const, label: "Announcements", icon: Megaphone },
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
        {activeTab === "availability" && (
          <motion.div
            key="availability"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <AvailabilityGrid
              groupId={groupId}
              isSelected={isSelected}
              getSlotCount={getSlotCount}
              toggleSlot={toggleSlot}
              selectAllDay={selectAllDay}
              clearAllDay={clearAllDay}
              totalMembers={members.length}
              loading={availLoading}
              slotDuration={group?.slot_duration ?? 30}
              isLocked={!!meeting || deadlinePassed}
              lockReason={
                meeting
                  ? "Meeting confirmed — availability is locked."
                  : deadlinePassed
                  ? `Deadline passed (${new Date(group!.availability_deadline!).toLocaleString()}) — availability is locked.`
                  : undefined
              }
              deadline={group?.availability_deadline ?? null}
            />
          </motion.div>
        )}

        {activeTab === "members" && (
          <motion.div
            key="members"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <MembersList
              members={members}
              userRole={userRole}
              currentUserId={user?.id}
              onRemove={handleRemoveMember}
            />
          </motion.div>
        )}

        {activeTab === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <MeetingResults
              slots={topSlots}
              isAdmin={userRole === "admin"}
              onSchedule={handleSchedule}
              confirmedMeeting={meeting}
              allMembers={members}
            />
          </motion.div>
        )}

        {activeTab === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Group Chat
                </CardTitle>
                <CardDescription>Chat with your group members</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Messages */}
                <div className="h-[400px] overflow-y-auto rounded-lg border bg-muted/30 p-4 space-y-3 mb-4">
                  {chatLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-muted-foreground text-sm">Loading messages...</span>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mb-2" />
                      <span className="text-sm">No messages yet. Start the conversation!</span>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.user_id === user?.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            {msg.user?.avatar_url && (
                              <AvatarImage src={msg.user.avatar_url} />
                            )}
                            <AvatarFallback className="text-xs">
                              {msg.user?.full_name?.charAt(0)?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[70%] ${isMe ? "text-right" : ""}`}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-xs font-medium ${isMe ? "order-2" : ""}`}>
                                {isMe ? "You" : msg.user?.full_name || "Unknown"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            {/* File preview */}
                            {msg.file_url && msg.file_type === "image" && (
                              <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="block mb-1">
                                <img
                                  src={msg.file_url}
                                  alt="Shared image"
                                  className="max-w-full max-h-48 rounded-lg border object-cover"
                                />
                              </a>
                            )}
                            {msg.file_url && msg.file_type === "pdf" && (
                              <a
                                href={msg.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm mb-1 ${
                                  isMe ? "bg-primary/80 text-primary-foreground" : "bg-background border"
                                }`}
                              >
                                <FileText className="h-4 w-4 shrink-0" />
                                <span className="truncate">PDF Document</span>
                                <Download className="h-3.5 w-3.5 shrink-0 ml-auto" />
                              </a>
                            )}
                            {/* Text message (hide "Shared a file" if we already show the file) */}
                            {!(msg.file_url && msg.message === "Shared a file") && msg.message && (
                              <div
                                className={`inline-block rounded-lg px-3 py-2 text-sm ${
                                  isMe
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background border"
                                }`}
                              >
                                {msg.message}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !user) return;
                      setFileUploading(true);
                      const result = await uploadFile(file);
                      if (result) {
                        await sendMessage(user.id, "", result.url, result.type);
                        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
                      }
                      setFileUploading(false);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={fileUploading}
                    title="Attach file (images or PDF)"
                  >
                    {fileUploading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && !e.shiftKey && chatInput.trim() && user) {
                        e.preventDefault();
                        setSendingChat(true);
                        await sendMessage(user.id, chatInput);
                        setChatInput("");
                        setSendingChat(false);
                        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    disabled={sendingChat}
                  />
                  <Button
                    onClick={async () => {
                      if (!chatInput.trim() || !user) return;
                      setSendingChat(true);
                      await sendMessage(user.id, chatInput);
                      setChatInput("");
                      setSendingChat(false);
                      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
                    }}
                    disabled={sendingChat || !chatInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "announcements" && (
          <motion.div
            key="announcements"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Megaphone className="h-5 w-5" />
                      Announcements
                    </CardTitle>
                    <CardDescription>Important updates from the admin</CardDescription>
                  </div>
                  {userRole === "admin" && (
                    <Button
                      size="sm"
                      onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      New
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* New Announcement Form */}
                <AnimatePresence>
                  {showAnnouncementForm && userRole === "admin" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-4"
                    >
                      <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                        <Input
                          placeholder="Announcement title"
                          value={announcementTitle}
                          onChange={(e) => setAnnouncementTitle(e.target.value)}
                        />
                        <textarea
                          placeholder="Write your announcement..."
                          value={announcementContent}
                          onChange={(e) => setAnnouncementContent(e.target.value)}
                          rows={3}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowAnnouncementForm(false);
                              setAnnouncementTitle("");
                              setAnnouncementContent("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            disabled={!announcementTitle.trim() || !announcementContent.trim() || creatingAnnouncement}
                            onClick={async () => {
                              if (!user) return;
                              setCreatingAnnouncement(true);
                              await createAnnouncement(user.id, announcementTitle, announcementContent);

                              // Email all members about the announcement
                              const memberEmails = members
                                .filter((m) => m.user_id !== user.id)
                                .map((m) => m.users?.email)
                                .filter(Boolean);
                              if (memberEmails.length > 0) {
                                fetch("/api/email/announcement", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    emails: memberEmails,
                                    groupName: group?.name || "Group",
                                    title: announcementTitle,
                                    content: announcementContent,
                                    authorName: user.user_metadata?.full_name || user.email || "Admin",
                                  }),
                                }).catch(() => {});
                              }

                              setAnnouncementTitle("");
                              setAnnouncementContent("");
                              setShowAnnouncementForm(false);
                              setCreatingAnnouncement(false);
                            }}
                          >
                            {creatingAnnouncement ? "Posting..." : "Post Announcement"}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Announcements List */}
                {announcementsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <span className="text-muted-foreground text-sm">Loading announcements...</span>
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Megaphone className="h-8 w-8 mb-2" />
                    <span className="text-sm">No announcements yet.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((ann, i) => (
                      <motion.div
                        key={ann.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`rounded-lg border p-4 ${
                          ann.pinned ? "border-amber-500/40 bg-amber-500/5" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {ann.pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                              <h4 className="font-semibold text-sm">{ann.title}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ann.content}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[11px] text-muted-foreground">
                                by {ann.user?.full_name || "Admin"}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {new Date(ann.created_at).toLocaleDateString()} {new Date(ann.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                          {userRole === "admin" && (
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => togglePin(ann.id, ann.pinned)}
                                title={ann.pinned ? "Unpin" : "Pin"}
                              >
                                <Pin className={`h-3.5 w-3.5 ${ann.pinned ? "text-amber-500" : ""}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => deleteAnnouncement(ann.id)}
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Availability Grid Component ─── */

function AvailabilityGrid({
  groupId,
  isSelected,
  getSlotCount,
  toggleSlot,
  selectAllDay,
  clearAllDay,
  totalMembers,
  loading,
  slotDuration,
  isLocked,
  lockReason,
  deadline,
}: {
  groupId: string;
  isSelected: (day: string, timeslot: string) => boolean;
  getSlotCount: (day: string, timeslot: string) => number;
  toggleSlot: (day: string, timeslot: string) => void;
  selectAllDay: (day: string, timeslots: string[]) => void;
  clearAllDay: (day: string) => void;
  totalMembers: number;
  loading: boolean;
  slotDuration: number;
  isLocked: boolean;
  lockReason?: string;
  deadline: string | null;
}) {
  const timeslots = generateTimeslots(slotDuration);

  if (loading) {
    return <Skeleton className="h-[600px] rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Availability</CardTitle>
        <CardDescription>
          {isLocked ? (
            <span className="text-amber-600 font-medium">
              🔒 {lockReason || "Availability is locked."}
            </span>
          ) : (
            <>
              Click on time slots to mark when you&apos;re available. Each slot is {slotDuration} min. Darker slots mean more members are free.
              {deadline && (
                <span className="block mt-1 text-amber-600 font-medium">
                  ⏰ Deadline: {new Date(deadline).toLocaleString()}
                </span>
              )}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Day headers */}
            <div className="mb-1 grid grid-cols-[80px_repeat(7,1fr)] gap-1">
              <div />
              {DAYS.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground sm:text-sm">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 3)}</span>
                </div>
              ))}
            </div>

            {/* Select All / Clear All buttons */}
            {!isLocked && (
              <div className="mb-2 grid grid-cols-[80px_repeat(7,1fr)] gap-1">
                <div />
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => selectAllDay(day, timeslots)}
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors"
                      title={`Select all ${day}`}
                    >
                      All
                    </button>
                    <span className="text-muted-foreground/40 text-[10px]">|</span>
                    <button
                      onClick={() => clearAllDay(day)}
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      title={`Clear all ${day}`}
                    >
                      Clear
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Time slots */}
            <div className="space-y-0.5">
              {timeslots.map((timeslot) => (
                <div key={timeslot} className="grid grid-cols-[80px_repeat(7,1fr)] gap-0.5">
                  <div className="flex items-center text-xs text-muted-foreground">
                    {timeslot}
                  </div>
                  {DAYS.map((day) => {
                    const selected = isSelected(day, timeslot);
                    const count = getSlotCount(day, timeslot);
                    const intensity = totalMembers > 0 ? count / totalMembers : 0;

                    return (
                      <label
                        key={`${day}-${timeslot}`}
                        className={`flex h-7 items-center justify-center rounded-sm transition-colors cursor-pointer ${
                          isLocked ? "cursor-not-allowed opacity-70 " : ""
                        }${
                          selected
                            ? "bg-primary/20 border border-primary"
                            : count > 0
                            ? `bg-primary/[${Math.max(0.1, intensity * 0.6).toFixed(1)}] border border-transparent`
                            : "bg-muted border border-transparent hover:bg-muted/80"
                        }`}
                        title={`${day} ${timeslot} — ${count} available${isLocked ? " (locked)" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={isLocked}
                          onChange={() => !isLocked && toggleSlot(day, timeslot)}
                          className="h-3.5 w-3.5 accent-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                        {count > 0 && !selected && (
                          <span className="ml-0.5 text-[10px] font-medium text-foreground">{count}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <input type="checkbox" checked readOnly className="h-3.5 w-3.5 accent-primary" />
            <span>Your selection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-sm bg-primary/30" />
            <span>Others available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-sm bg-muted" />
            <span>No one available</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Members List Component ─── */

function MembersList({
  members,
  userRole,
  currentUserId,
  onRemove,
}: {
  members: { user_id: string; role: string; users: { full_name: string | null; email: string; avatar_url: string | null } }[];
  userRole: "admin" | "member" | null;
  currentUserId: string | undefined;
  onRemove: (memberId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Group Members</CardTitle>
        <CardDescription>{members.length} member{members.length !== 1 ? "s" : ""}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member, i) => (
            <motion.div
              key={member.user_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <Avatar className="h-10 w-10">
                {member.users?.avatar_url && (
                  <AvatarImage src={member.users.avatar_url} />
                )}
                <AvatarFallback>
                  {member.users?.full_name
                    ? member.users.full_name.charAt(0).toUpperCase()
                    : member.users?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{member.users?.full_name || "Unknown"}</p>
                <p className="text-sm text-muted-foreground">{member.users?.email}</p>
              </div>
              {member.role === "admin" && (
                <Badge variant="secondary" className="gap-1">
                  <Crown className="h-3 w-3" />
                  Admin
                </Badge>
              )}
              {userRole === "admin" && member.role !== "admin" && member.user_id !== currentUserId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => onRemove(member.user_id)}
                  title="Remove member"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Meeting Results Component ─── */

import type { RecommendedSlot, Meeting } from "@/types";

function MeetingResults({
  slots,
  isAdmin,
  onSchedule,
  confirmedMeeting,
  allMembers,
}: {
  slots: RecommendedSlot[];
  isAdmin: boolean;
  onSchedule: (day: string, timeslot: string) => void;
  confirmedMeeting: Meeting | null;
  allMembers: { user_id: string; role: string; users: { full_name: string | null; email: string; avatar_url: string | null } }[];
}) {
  if (slots.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No availability data yet</h3>
          <p className="mt-1 text-muted-foreground">
            Members need to submit their availability first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Recommended Meeting Times
        </CardTitle>
        <CardDescription>
          Ranked by the number of members available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {slots.map((slot, i) => {
            const isConfirmed =
              confirmedMeeting?.scheduled_day === slot.day &&
              confirmedMeeting?.scheduled_time === slot.timeslot;

            return (
              <motion.div
                key={`${slot.day}-${slot.timeslot}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                  isConfirmed ? "border-green-500/50 bg-green-500/5" : ""
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">
                    {slot.day} at {slot.timeslot}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 flex-1 max-w-[200px] rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${slot.percentage}%` }}
                        transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {slot.count} member{slot.count !== 1 ? "s" : ""} ({slot.percentage}%)
                    </span>
                  </div>
                  {/* Available / Unavailable members */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {allMembers.map((m) => {
                      const isAvailable = slot.members.includes(m.user_id);
                      return (
                        <span
                          key={m.user_id}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            isAvailable
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : "bg-red-500/10 text-red-500 dark:text-red-400"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-green-500" : "bg-red-500"}`} />
                          {m.users?.full_name || m.users?.email?.split("@")[0] || "Unknown"}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {isConfirmed ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Confirmed
                  </Badge>
                ) : (
                  isAdmin &&
                  !confirmedMeeting && (
                    <Button
                      size="sm"
                      onClick={() => onSchedule(slot.day, slot.timeslot)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirm
                    </Button>
                  )
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
