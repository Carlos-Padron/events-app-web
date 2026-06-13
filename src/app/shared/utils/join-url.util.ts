/** Builds the public guest-join URL for an event invitation token. */
export function buildJoinUrl(origin: string, invitationToken: string): string {
  return `${origin}/join/${invitationToken}`;
}
