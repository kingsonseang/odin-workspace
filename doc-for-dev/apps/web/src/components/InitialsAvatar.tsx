import type { UserDto } from "@forgeboard/shared";
import { initials } from "../utils/format";

interface InitialsAvatarProps {
  user: UserDto;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const tones = ["sage", "ochre", "clay", "slate", "moss"];

function toneFor(userId: string): string {
  const total = [...userId].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0
  );
  return tones[total % tones.length] ?? "sage";
}

export function InitialsAvatar({
  user,
  size = "md",
  className = ""
}: InitialsAvatarProps) {
  return (
    <span
      className={`avatar avatar--${size} avatar--${toneFor(user.id)} ${className}`.trim()}
      title={`${user.name} — ${user.title}`}
      aria-label={user.name}
    >
      {initials(user.name)}
    </span>
  );
}
