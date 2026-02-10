import { Linkedin } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { TeamMember } from "@/types";

interface TeamSectionProps {
  team: TeamMember[];
}

export function TeamSection({ team }: TeamSectionProps) {
  return (
    <GlassCard>
      <h2 className="text-lg font-semibold mb-4">Team</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((member) => (
          <div
            key={member.name}
            className="flex items-center gap-3 rounded-lg bg-background-secondary/50 p-3"
          >
            <Avatar>
              <AvatarFallback className="bg-highlight/10 text-highlight text-sm">
                {member.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{member.name}</p>
              <p className="text-xs text-foreground-muted truncate">
                {member.role}
              </p>
            </div>
            {member.linkedin && (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground-muted hover:text-highlight"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
