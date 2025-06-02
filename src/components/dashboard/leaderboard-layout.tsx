import { createAsync, query } from "@solidjs/router";
import { getSession } from "@auth/solid-start";
import { authOptions } from "~/routes/api/auth/[...solidauth]";
import db from "~/lib/db";
import { Component, For, Show } from "solid-js";
import Layout from "~/components/layout";
import LoadingSpinner from "~/components/loading";
import { LeaderboardUser } from "~/lib/types";
import { cn } from "~/lib/utils";
import { getRequestEvent } from "solid-js/web";

// Query serveur pour récupérer le leaderboard
export const getLeaderboardData = query(async () => {
  "use server";

  const event = getRequestEvent();
    if (!event) throw new Error("No request event");
    
  
  const session = await getSession(event.request,authOptions);
  if (!session?.user) {
    throw new Error("Non autorisé");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email! },
    include: {
      character: {
        include: {
          quests: {
            where: { status: "COMPLETED" },
            select: { id: true },
          },
        }
      }
    }
  });

  if (!user) {
    throw new Error("Utilisateur non trouvé");
  }

  if (!user.character) {
    throw new Error("Personnage non trouvé");
  }

  const characterId = user.character.id;

  const topCharacters = await db.character.findMany({
    orderBy: [
      { level: "desc" },
      { experience: "desc" },
    ],
    take: 99,
    include: {
      user: true,
      quests: {
        where: { status: "COMPLETED" },
        select: { id: true },
      },
    },
  });

  const leaderboardData = topCharacters.map((char, index) => ({
    id: char.id,
    rank: index + 1,
    userName: char.user.name || '',
    characterName: char.name,
    level: char.level.toString(),
    class: char.class,
    experience: char.experience.toString(),
    totalCompletedQuests: char.quests.length,
  }));

  const rankIndex = leaderboardData.findIndex((char) => char.id === characterId);
  const char = user.character;

  return {
    leaderboard: leaderboardData,
    user: {
      id: char.id,
      rank: rankIndex === -1 ? 99 : rankIndex + 1,
      userName: user.name || '',
      characterName: char.name,
      level: char.level.toString(),
      class: char.class,
      experience: char.experience.toString(),
      totalCompletedQuests: char.quests.length,
    } as LeaderboardUser
  };
}, "leaderboard");

const LeaderboardLayout: Component = () => {
  const data = createAsync(() => getLeaderboardData());

  return (
    <Layout>
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-center text-blue-400 mb-8">Classement des chasseurs</h1>

        <Show
          when={data()}
          fallback={
            <div class="py-10 max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-lg">
              <LoadingSpinner size="medium" />
            </div>
          }
        >
          {(result) => (
            <>
              <div class="max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div class="w-full p-1 overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="bg-gray-700">
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-16">Rang</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Chasseur</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-24">Niveau</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32 hidden md:table-cell">Classe</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32">XP Total</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32 hidden md:table-cell">Quêtes</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-700">
                      <For each={result().leaderboard}>
                        {(player) => (
                          <tr
                            class={cn(
                              player.userName === result().user.userName
                                ? "bg-blue-900/20"
                                : player.rank % 2 === 0
                                  ? "bg-gray-800"
                                  : "bg-gray-750"
                            )}
                          >
                            <td class="px-4 py-4 whitespace-nowrap">
                              <div class={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                                player.rank === 1
                                  ? "bg-yellow-900/50 text-yellow-400"
                                  : player.rank === 2
                                    ? "bg-gray-600/50 text-gray-300"
                                    : player.rank === 3
                                      ? "bg-amber-900/50 text-amber-600"
                                      : "bg-gray-700/50 text-gray-400"
                              )}>
                                {player.rank}
                              </div>
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap">
                              <div class="font-medium text-gray-200">
                                {player.characterName}
                                <Show when={player.id === result().user.id}>
                                  <span class="ml-2 text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">Vous</span>
                                </Show>
                                <p class="text-xs leading-relaxed tracking-wider text-gray-400">
                                  par {player.userName}
                                </p>
                              </div>
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap">
                              <div class="text-sm text-gray-300">Niv {player.level}</div>
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                              <span class={cn(
                                "px-2 py-1 text-xs rounded-md capitalize",
                                player.class === "WARRIOR"
                                  ? "bg-red-900/30 text-red-400"
                                  : player.class === "MAGE"
                                    ? "bg-blue-900/30 text-blue-400"
                                    : "bg-green-900/30 text-green-400"
                              )}>
                                {player.class.toLowerCase()}
                              </span>
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap">
                              <div class="text-sm font-medium text-blue-400">
                                {parseInt(player.experience).toLocaleString()}
                              </div>
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                              <div class="text-sm text-gray-300">{player.totalCompletedQuests} terminées</div>
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </div>

              <Show when={result().user}>
                <div class="max-w-4xl mx-auto mt-8">
                  <div class="bg-gray-800 rounded-xl shadow-lg p-6">
                    <h2 class="text-xl font-bold text-gray-200 mb-4">Vos statistiques</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div class="bg-gray-700 rounded-lg p-4">
                        <h4 class="text-sm text-gray-400 mb-1">Rang actuel</h4>
                        <p class="text-2xl font-bold text-blue-400">
                          #{result().user.rank}
                        </p>
                      </div>

                      <div class="bg-gray-700 rounded-lg p-4">
                        <h4 class="text-sm text-gray-400 mb-1">XP Total</h4>
                        <p class="text-2xl font-bold text-blue-400">
                          {parseInt(result().user.experience).toLocaleString()}
                        </p>
                      </div>

                      <div class="bg-gray-700 rounded-lg p-4">
                        <h4 class="text-sm text-gray-400 mb-1">Quêtes terminées</h4>
                        <p class="text-2xl font-bold text-blue-400">
                          {result().user.totalCompletedQuests}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Show>
            </>
          )}
        </Show>
      </div>
    </Layout>
  );
};

export default LeaderboardLayout;