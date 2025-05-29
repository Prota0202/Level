import { useNavigate } from "@solidjs/router";
import { Component, createSignal, For, onMount, Show } from "solid-js";
import Layout from "~/components/layout";
import LoadingSpinner from "~/components/loading";
import { LeaderboardUser } from "~/lib/types";
import { cn } from "~/lib/utils";

const LeaderboardPage: Component = () => {
  const [isLoading, setIsLoading] = createSignal(true);
  const [leaderboardUsers, setLeaderboardUsers] = createSignal<LeaderboardUser[]>([]);
  const [user, setUser] = createSignal<LeaderboardUser | null>(null);
  const navigate = useNavigate();

  onMount(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leaderboard`);

      switch (res.status) {
        case 200:
          const data = await res.json();
          setLeaderboardUsers(data.leaderboard);
          setUser(data.user);
          break;
        case 404:
          navigate('/404');
          break;
        default:
          const errorData = await res.json();
          throw Error(errorData?.error || 'Internal server error');
      }
    } catch (error) {
      console.log({ error });
      navigate('/500');
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <Layout>
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-center text-blue-400 mb-8">Hunter Ranking</h1>

        <Show
          when={!isLoading()}
          fallback={(
            <div class="py-10 max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-lg">
              <LoadingSpinner size="medium" />
            </div>
          )}
        >
          <div class="max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div class="w-full p-1 overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="bg-gray-700">
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-16">Rank</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hunter</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-24">Level</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32 hidden md:table-cell">Class</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32">Total XP</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32 hidden md:table-cell">Quests</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                  <For each={leaderboardUsers()}>
                    {(player) => (
                      <tr
                        class={cn(
                          player.userName === user()?.userName
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
                            <Show when={player.id === user()?.id}>
                              <span class="ml-2 text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">You</span>
                            </Show>
                            <p class="text-xs leading-relaxed tracking-wider">
                              by {player.userName}
                            </p>
                          </div>
                        </td>
                        <td class="px-4 py-4 whitespace-nowrap">
                          <div class="text-sm text-gray-300">Lvl {player.level}</div>
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
                          <div class="text-sm font-medium text-blue-400">{player.experience.toLocaleString()}</div>
                        </td>
                        <td class="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                          <div class="text-sm text-gray-300">{player.totalCompletedQuests} completed</div>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>

          <Show when={user()}>
            <div class="max-w-4xl mx-auto mt-8">
              <div class="bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold text-gray-200 mb-4">Your Statistics</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div class="bg-gray-700 rounded-lg p-4">
                    <h4 class="text-sm text-gray-400 mb-1">Current Rank</h4>
                    <p class="text-2xl font-bold text-blue-400">
                      #{user()!.rank}
                    </p>
                  </div>

                  <div class="bg-gray-700 rounded-lg p-4">
                    <h4 class="text-sm text-gray-400 mb-1">Total XP</h4>
                    <p class="text-2xl font-bold text-blue-400">
                      {user()!.experience.toLocaleString()}
                    </p>
                  </div>

                  <div class="bg-gray-700 rounded-lg p-4">
                    <h4 class="text-sm text-gray-400 mb-1">Quests Completed</h4>
                    <p class="text-2xl font-bold text-blue-400">
                      {user()!.totalCompletedQuests}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Show>
        </Show>
      </div>
    </Layout>
  );
};

export default LeaderboardPage;
