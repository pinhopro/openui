/** The background colors the contact avatars cycle through, picked by the initials. */
const AVATAR_COLORS = ["#6b5bd2", "#d26b5b", "#2d8fd2", "#c9952e", "#2fa76f", "#d25ba8", "#3fa7b8"];

/** The ink color on every avatar background. */
export const AVATAR_TEXT = "#111b21";

/** A stable color for a contact, from the character codes of its initials. */
export function avatarColor(initials: string): string {
  let sum = 0;
  for (const character of Array.from(initials)) sum += character.codePointAt(0) ?? 0;
  return AVATAR_COLORS[sum % AVATAR_COLORS.length] as string;
}

/** The two initials centered in a four-cell block: ` CR `. */
export function avatarBlock(initials: string): string {
  const two = Array.from(initials).slice(0, 2).join("");
  if (two.length === 2) return " " + two + " ";
  if (two.length === 1) return " " + two + "  ";
  return "    ";
}
