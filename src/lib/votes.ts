import { Vote } from "./types";
import { normalizeLinkedIn } from "./linkedin";

export function hasVotedInCategory(
  votes: Vote[],
  category: string,
  voterLinkedIn: string
): { voted: boolean; nomineeId?: string } {
  const normalizedLinkedIn = normalizeLinkedIn(voterLinkedIn);
  const existingVote = votes.find(
    vote => vote.category === category && vote.voter.linkedin === normalizedLinkedIn
  );
  
  return {
    voted: !!existingVote,
    nomineeId: existingVote?.nomineeId
  };
}

export function hasVotedForNominee(
  votes: Vote[],
  nomineeId: string,
  category: string,
  voterLinkedIn: string
): boolean {
  const normalizedLinkedIn = normalizeLinkedIn(voterLinkedIn);
  return votes.some(
    vote =>
      vote.nomineeId === nomineeId &&
      vote.category === category &&
      vote.voter.linkedin === normalizedLinkedIn
  );
}

export function getVoteCount(votes: Vote[], nomineeId: string): number {
  return votes.filter(vote => vote.nomineeId === nomineeId).length;
}

export function buildVoterKeys(voterLinkedIn: string, category: string, nomineeId: string) {
  const normalizedLinkedIn = normalizeLinkedIn(voterLinkedIn);
  return {
    categoryKey: `${normalizedLinkedIn}__${category}`,
    nomineeKey: `${normalizedLinkedIn}__${nomineeId}__${category}`
  };
}