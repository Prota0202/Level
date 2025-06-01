import Layout from "~/components/layout";
import { AttributeBar } from "~/components/dashboard/attribute-bar";
import { createMemo, createSignal, onMount, Show } from "solid-js";
import { A, action, useAction, useNavigate, useSearchParams } from "@solidjs/router";
import { SuccessAlert } from "~/components/success-alert";
import { CharacterDashboard as CharacterDashboarType } from "~/lib/types";
import LoadingSpinner from "~/components/loading";
import db from "~/lib/db";
import { useToast } from "~/components/toast/toast";

type AttributesType = Pick<
  CharacterDashboarType,
  'endurance' | 'strength' | 'intelligence' | 'availablePoints'
>;

const upgradeAttributes = action(async (
  characterId: number,
  data: Record<keyof AttributesType, number>
) => {
  "use server";

  try {
    const updatedCharacter = await db.character.update({
      where: { id: characterId },
      data: { ...data }
    });

    return {
      success: "Attributes successfully upgraded.",
      data: {
        endurance: updatedCharacter.endurance,
        strength: updatedCharacter.strength,
        intelligence: updatedCharacter.intelligence,
        availablePoints: updatedCharacter.availablePoints,
      }
    };
  } catch (err) {
    console.error(err);
    return { error: "An unexpected error occurred. Please try again." };
  }
}, "upgradeAttributes");

export default function DashboardLayout() {
  const upgradeAttributesAction = useAction(upgradeAttributes);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [character, setCharacter] = createSignal<CharacterDashboarType | null>(null);
  const [attributes, setAttributes] = createSignal<AttributesType | null>(null);
  const expPercentage = createMemo(() => {
    if (character()?.maxExpNeeded === 0) return 100;
    return (character()?.experience! / character()?.maxExpNeeded!) * 100
  });

  const handleAttributeDecrement = (key: keyof Omit<AttributesType, 'availablePoints'>) => {
    const isAllowed = attributes()?.[key]! > character()?.[key]!;

    if (isAllowed) {
      setAttributes((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          [key]: prev[key] - 1,
          availablePoints: prev.availablePoints + 1
        }
      });
    }
  }

  const handleAttributeIncrement = (key: keyof Omit<AttributesType, 'availablePoints'>) => {
    const isAvailable = attributes()?.availablePoints! > 0;

    if (isAvailable) {
      setAttributes((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          [key]: prev[key] + 1,
          availablePoints: prev.availablePoints - 1
        }
      });
    }
  }

  onMount(async () => {
    try {
      const res = await fetch(`/api/dashboard`);

      switch (res.status) {
        case 200:
          const data = await res.json();
          setCharacter(data);
          setAttributes({
            availablePoints: data.availablePoints,
            endurance: data.endurance,
            experience: data.experience,
            intelligence: data.intelligence,
            strength: data.strength,
          });
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
    }
  });

  return (
    <Layout>
      <div class="container mx-auto h-full px-4 py-8">
        <Show
          when={character()}
          fallback={(
            <div class="h-full flex justify-center items-center">
              <LoadingSpinner size="large" message="Please wait..." />
            </div>
          )}
        >
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Character Info Card */}
            <div class="lg:col-span-1 bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div class="bg-linear-to-r from-blue-900 to-purple-900 p-6">
                <h2 class="text-2xl font-bold text-blue-100">{character()?.user.name}</h2>
                <div class="flex items-center mt-2">
                  <span class="bg-blue-600 text-xs font-medium text-white px-2.5 py-0.5 rounded">
                    Level {character()?.level}
                  </span>
                  <span class="ml-2 text-sm text-gray-300">
                    {character()?.class === "WARRIOR" && "Warrior"}
                    {character()?.class === "MAGE" && "Mage"}
                    {character()?.class === "ROGUE" && "Rogue"}
                  </span>
                </div>
                <div class="mt-4">
                  <p class="text-sm text-gray-300">Available Points:</p>
                  <span class="text-yellow-400 font-bold text-lg">
                    {attributes()?.availablePoints}
                  </span>
                </div>
                <div class="mt-2">
                  <div class="flex justify-between text-sm text-gray-300 mb-1">
                    <span>XP</span>
                    <span>{character()?.experience} / {character()?.maxExpNeeded || '-'}</span>
                  </div>
                  <div class="w-full bg-gray-500 rounded-full h-2.5">
                    <div
                      class="bg-blue-500 h-2.5 rounded-full"
                      style={{ width: `${expPercentage()}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div class="p-6">
                <h3 class="text-lg font-medium text-gray-200 mb-4">Attributes</h3>

                <div class="space-y-4">
                  {/* Update alokasi point */}
                  <AttributeBar
                    label="Strength"
                    value={attributes()?.strength || 0}
                    color="bg-red-500"
                    iconColor="text-red-400"
                    iconBg="bg-red-900"
                    onDecrement={() => handleAttributeDecrement('strength')}
                    onIncrement={() => handleAttributeIncrement('strength')}
                    disabledDecrement={attributes()?.strength! <= character()?.strength!}
                    disabledIncrement={attributes()?.availablePoints === 0}
                  />
                  <AttributeBar
                    label="Intelligence"
                    value={attributes()?.intelligence || 0}
                    color="bg-blue-500"
                    iconColor="text-blue-400"
                    iconBg="bg-blue-900"
                    onDecrement={() => handleAttributeDecrement('intelligence')}
                    onIncrement={() => handleAttributeIncrement('intelligence')}
                    disabledDecrement={attributes()?.intelligence! <= character()?.intelligence!}
                    disabledIncrement={attributes()?.availablePoints === 0}
                  />
                  <AttributeBar
                    label="Endurance"
                    value={attributes()?.endurance || 0}
                    color="bg-green-500"
                    iconColor="text-green-400"
                    iconBg="bg-green-900"
                    onDecrement={() => handleAttributeDecrement('endurance')}
                    onIncrement={() => handleAttributeIncrement('endurance')}
                    disabledDecrement={attributes()?.endurance! <= character()?.endurance!}
                    disabledIncrement={attributes()?.availablePoints === 0}
                  />
                </div>
                <div class="mt-6">
                  <button
                    class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium cursor-pointer"
                    onClick={async () => {
                      const res = await upgradeAttributesAction(character()?.id!, attributes()!);
                      if (res.success && res.data) {
                        setAttributes(res.data);
                        setCharacter((prev) => !prev ? null : { ...prev, ...res.data });
                        toast.achievement(res.success);
                      } else if (res.error) {
                        toast.error(res.error);
                      }
                    }}
                  >
                    Allocate Points
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div class="lg:col-span-2 space-y-4">
              <Show when={searchParams.create_character === 'success'}>
                <SuccessAlert
                  message="Wohoo...You have successfully created your character🔥"
                />
              </Show>
              {/* Quest Summary */}
              <div class="bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-medium text-gray-200 mb-4">Quest Summary</h3>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="bg-green-900/30 rounded-lg p-4 text-center">
                    <h4 class="text-2xl font-bold text-green-400">{character()!.quests.completed}</h4>
                    <span class="text-sm text-gray-400">Completed</span>
                  </div>

                  <div class="bg-yellow-900/30 rounded-lg p-4 text-center">
                    <h4 class="text-2xl font-bold text-yellow-400">{character()!.quests.inProgress}</h4>
                    <span class="text-sm text-gray-400">In Progress</span>
                  </div>

                  <div class="bg-red-900/30 rounded-lg p-4 text-center">
                    <h4 class="text-2xl font-bold text-red-400">{character()!.quests.failed}</h4>
                    <span class="text-sm text-gray-400">Failed</span>
                  </div>
                </div>

                <div class="mt-4">
                  <A href="/quests">
                    <button class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium cursor-pointer">
                      View All Quests
                    </button>
                  </A>
                </div>
              </div>

              {/* Skills & Inventory */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Skills */}
                <div class="bg-gray-800 rounded-xl shadow-lg p-6">
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-gray-200">Skills</h3>
                    <A href="/skills">
                      <button class="text-sm text-blue-400 hover:text-blue-500">
                        View All
                      </button>
                    </A>
                  </div>

                  <div class="space-y-3">
                    <Show
                      when={character()!.skills.length > 0}
                      fallback={
                        <div class="flex flex-col items-center justify-center py-14 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <p class="text-sm font-medium">You don't have any skills yet</p>
                        </div>
                      }
                    >
                      {character()!.skills.map((skill) => (
                        <div class="bg-gray-700 rounded-lg p-3">
                          <div class="flex justify-between items-center">
                            <span class="font-medium text-gray-300">{skill.name}</span>
                            <span class="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">
                              Lvl {skill.level}/{skill.maxLevel}
                            </span>
                          </div>
                        </div>
                      ))}
                    </Show>
                  </div>
                </div>

                {/* Inventory */}
                <div class="bg-gray-800 rounded-xl shadow-lg p-6">
                  <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-gray-200">Inventory</h3>
                    <A href="/inventory">
                      <button class="text-sm text-blue-400 hover:text-blue-500">
                        View All
                      </button>
                    </A>
                  </div>

                  <div class="space-y-3">
                    <Show
                      when={character()!.inventory.length > 0}
                      fallback={
                        <div class="flex flex-col items-center justify-center py-14 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p class="text-sm font-medium">Inventory is empty</p>
                        </div>
                      }
                    >
                      {character()!.inventory.map((item) => (
                        <div class="bg-gray-700 rounded-lg p-3">
                          <div class="flex justify-between items-start">
                            <div>
                              <div class="font-medium text-gray-300">{item.name}</div>
                              <div class="text-xs text-gray-400">{item.description}</div>
                            </div>
                            <span class="block min-w-8 text-center text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                              x{item.quantity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </Show>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </Show>
      </div>
    </Layout>
  );
}
