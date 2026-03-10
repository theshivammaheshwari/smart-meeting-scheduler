export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  slot_duration: number; // in minutes: 30, 60, 90, 120
  availability_deadline: string | null;
  join_code: string | null;
  created_by: string;
  created_at: string;
}

export interface Invite {
  id: string;
  group_id: string;
  email: string;
  status: "pending" | "accepted";
  invited_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
}

export interface Availability {
  id: string;
  group_id: string;
  user_id: string;
  day: string;
  timeslot: string;
  created_at: string;
}

export interface Meeting {
  id: string;
  group_id: string;
  scheduled_day: string;
  scheduled_time: string;
  created_by: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "invite" | "meeting_scheduled" | "availability_updated";
  message: string;
  read: boolean;
  group_id: string | null;
  created_at: string;
}

export interface RecommendedSlot {
  day: string;
  timeslot: string;
  count: number;
  percentage: number;
  members: string[];
}

export interface GroupWithMembers extends Group {
  group_members: (GroupMember & { users: User })[];
}
