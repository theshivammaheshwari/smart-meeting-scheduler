// Common timezones grouped by region
export const TIMEZONE_OPTIONS = [
  // Asia
  { value: "Asia/Kolkata", label: "India (IST, UTC+5:30)" },
  { value: "Asia/Dubai", label: "Dubai (GST, UTC+4)" },
  { value: "Asia/Karachi", label: "Pakistan (PKT, UTC+5)" },
  { value: "Asia/Dhaka", label: "Bangladesh (BST, UTC+6)" },
  { value: "Asia/Kathmandu", label: "Nepal (NPT, UTC+5:45)" },
  { value: "Asia/Colombo", label: "Sri Lanka (IST, UTC+5:30)" },
  { value: "Asia/Shanghai", label: "China (CST, UTC+8)" },
  { value: "Asia/Tokyo", label: "Japan (JST, UTC+9)" },
  { value: "Asia/Seoul", label: "South Korea (KST, UTC+9)" },
  { value: "Asia/Singapore", label: "Singapore (SGT, UTC+8)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT, UTC+8)" },
  { value: "Asia/Bangkok", label: "Thailand (ICT, UTC+7)" },
  { value: "Asia/Jakarta", label: "Indonesia (WIB, UTC+7)" },
  { value: "Asia/Kuala_Lumpur", label: "Malaysia (MYT, UTC+8)" },
  { value: "Asia/Manila", label: "Philippines (PHT, UTC+8)" },
  { value: "Asia/Taipei", label: "Taiwan (CST, UTC+8)" },
  { value: "Asia/Ho_Chi_Minh", label: "Vietnam (ICT, UTC+7)" },
  { value: "Asia/Riyadh", label: "Saudi Arabia (AST, UTC+3)" },
  { value: "Asia/Tehran", label: "Iran (IRST, UTC+3:30)" },
  { value: "Asia/Baghdad", label: "Iraq (AST, UTC+3)" },
  { value: "Asia/Kabul", label: "Afghanistan (AFT, UTC+4:30)" },
  { value: "Asia/Yangon", label: "Myanmar (MMT, UTC+6:30)" },
  { value: "Asia/Almaty", label: "Kazakhstan (ALMT, UTC+6)" },
  { value: "Asia/Tashkent", label: "Uzbekistan (UZT, UTC+5)" },

  // Europe
  { value: "Europe/London", label: "UK (GMT/BST, UTC+0/+1)" },
  { value: "Europe/Paris", label: "France (CET, UTC+1)" },
  { value: "Europe/Berlin", label: "Germany (CET, UTC+1)" },
  { value: "Europe/Rome", label: "Italy (CET, UTC+1)" },
  { value: "Europe/Madrid", label: "Spain (CET, UTC+1)" },
  { value: "Europe/Amsterdam", label: "Netherlands (CET, UTC+1)" },
  { value: "Europe/Brussels", label: "Belgium (CET, UTC+1)" },
  { value: "Europe/Zurich", label: "Switzerland (CET, UTC+1)" },
  { value: "Europe/Stockholm", label: "Sweden (CET, UTC+1)" },
  { value: "Europe/Oslo", label: "Norway (CET, UTC+1)" },
  { value: "Europe/Copenhagen", label: "Denmark (CET, UTC+1)" },
  { value: "Europe/Helsinki", label: "Finland (EET, UTC+2)" },
  { value: "Europe/Athens", label: "Greece (EET, UTC+2)" },
  { value: "Europe/Istanbul", label: "Turkey (TRT, UTC+3)" },
  { value: "Europe/Moscow", label: "Russia - Moscow (MSK, UTC+3)" },
  { value: "Europe/Warsaw", label: "Poland (CET, UTC+1)" },
  { value: "Europe/Bucharest", label: "Romania (EET, UTC+2)" },
  { value: "Europe/Kiev", label: "Ukraine (EET, UTC+2)" },
  { value: "Europe/Prague", label: "Czech Republic (CET, UTC+1)" },
  { value: "Europe/Vienna", label: "Austria (CET, UTC+1)" },
  { value: "Europe/Dublin", label: "Ireland (GMT/IST, UTC+0/+1)" },
  { value: "Europe/Lisbon", label: "Portugal (WET, UTC+0)" },

  // Americas
  { value: "America/New_York", label: "US Eastern (EST, UTC-5)" },
  { value: "America/Chicago", label: "US Central (CST, UTC-6)" },
  { value: "America/Denver", label: "US Mountain (MST, UTC-7)" },
  { value: "America/Los_Angeles", label: "US Pacific (PST, UTC-8)" },
  { value: "America/Anchorage", label: "US Alaska (AKST, UTC-9)" },
  { value: "Pacific/Honolulu", label: "US Hawaii (HST, UTC-10)" },
  { value: "America/Toronto", label: "Canada Eastern (EST, UTC-5)" },
  { value: "America/Vancouver", label: "Canada Pacific (PST, UTC-8)" },
  { value: "America/Mexico_City", label: "Mexico (CST, UTC-6)" },
  { value: "America/Sao_Paulo", label: "Brazil (BRT, UTC-3)" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (ART, UTC-3)" },
  { value: "America/Bogota", label: "Colombia (COT, UTC-5)" },
  { value: "America/Lima", label: "Peru (PET, UTC-5)" },
  { value: "America/Santiago", label: "Chile (CLT, UTC-4)" },

  // Africa
  { value: "Africa/Cairo", label: "Egypt (EET, UTC+2)" },
  { value: "Africa/Lagos", label: "Nigeria (WAT, UTC+1)" },
  { value: "Africa/Nairobi", label: "Kenya (EAT, UTC+3)" },
  { value: "Africa/Johannesburg", label: "South Africa (SAST, UTC+2)" },
  { value: "Africa/Casablanca", label: "Morocco (WET, UTC+0)" },

  // Oceania
  { value: "Australia/Sydney", label: "Australia Eastern (AEST, UTC+10)" },
  { value: "Australia/Perth", label: "Australia Western (AWST, UTC+8)" },
  { value: "Australia/Adelaide", label: "Australia Central (ACST, UTC+9:30)" },
  { value: "Pacific/Auckland", label: "New Zealand (NZST, UTC+12)" },
  { value: "Pacific/Fiji", label: "Fiji (FJT, UTC+12)" },

  // UTC
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
];

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function formatTimeInTimezone(timeStr: string, fromTz: string, toTz: string): string {
  // timeStr is like "08:00", "14:30" etc.
  // We create a date in the fromTz and convert to toTz
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);

  try {
    return now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: toTz,
    });
  } catch {
    return timeStr;
  }
}

export function getTimezoneLabel(tz: string): string {
  const found = TIMEZONE_OPTIONS.find((t) => t.value === tz);
  if (found) return found.label;
  // Fallback: format the timezone name
  return tz.replace(/_/g, " ").replace(/\//g, " / ");
}

export function getTimezoneAbbr(tz: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: tz,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value ?? tz;
  } catch {
    return tz;
  }
}
