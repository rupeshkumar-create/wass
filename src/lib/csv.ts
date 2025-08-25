import { Nomination, Vote } from "./types";

export function nominationsToCsv(nominations: Nomination[]): string {
  const headers = [
    "ID",
    "Category",
    "Type",
    "Status",
    "Created At",
    "Moderated At",
    "Moderator Note",
    "Unique Key",
    "Nominator Name",
    "Nominator Email",
    "Nominator Phone",
    "Nominee Name",
    "Nominee Email",
    "Nominee Title/Website",
    "Nominee Country",
    "Nominee LinkedIn",
    "Live URL"
  ];

  const rows = nominations.map(nomination => [
    nomination.id,
    nomination.category,
    nomination.type,
    nomination.status,
    nomination.createdAt,
    nomination.moderatedAt || "",
    nomination.moderatorNote || "",
    nomination.uniqueKey || "",
    nomination.nominator.name,
    nomination.nominator.email,
    nomination.nominator.phone || "",
    nomination.nominee.name,
    "email" in nomination.nominee ? nomination.nominee.email || "" : "",
    "title" in nomination.nominee ? nomination.nominee.title || "" : nomination.nominee.website,
    nomination.nominee.country || "",
    nomination.nominee.linkedin,
    nomination.liveUrl
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(","))
    .join("\n");
}

export function votesToCsv(votes: Vote[]): string {
  const headers = [
    "Nominee ID", 
    "Category", 
    "Voter First Name", 
    "Voter Last Name", 
    "Voter Email", 
    "Voter LinkedIn", 
    "IP", 
    "User Agent", 
    "Timestamp"
  ];

  const rows = votes.map(vote => [
    vote.nomineeId,
    vote.category,
    vote.voter.firstName,
    vote.voter.lastName,
    vote.voter.email,
    vote.voter.linkedin,
    vote.ip,
    vote.ua,
    vote.ts
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(","))
    .join("\n");
}

// Public version that excludes sensitive voter information
export function votesToPublicCsv(votes: Vote[]): string {
  const headers = ["Nominee ID", "Category", "Timestamp"];

  const rows = votes.map(vote => [
    vote.nomineeId,
    vote.category,
    vote.ts
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(","))
    .join("\n");
}