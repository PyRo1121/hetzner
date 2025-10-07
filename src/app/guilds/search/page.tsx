'use client';

import { useRouter } from 'next/navigation';

import { GuildSearch } from '@/components/guilds/guild-search';

export default function GuildSearchPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <GuildSearch onSelectGuild={(guild) => router.push(`/guilds/${guild.Id}`)} />
    </div>
  );
}
