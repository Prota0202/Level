import { createAsync, query, action, useAction, Navigate } from "@solidjs/router";
import { getSession } from "@auth/solid-start";
import { authOptions } from "~/routes/api/auth/[...solidauth]";
import db from "~/lib/db";
import Layout from "~/components/layout";
import { AttributeBar } from "~/components/dashboard/attribute-bar";
import { createMemo, createSignal, Show } from "solid-js";
import { A, useSearchParams } from "@solidjs/router";
import { SuccessAlert } from "~/components/success-alert";
import { CharacterDashboard as CharacterDashboardType } from "~/lib/types";
import LoadingSpinner from "~/components/loading";
import { useToast } from "~/components/toast/toast";

type AttributesType = Pick<
  CharacterDashboardType,
  'endurance' | 'strength' | 'intelligence' | 'availablePoints'
>;

// Query serveur pour récupérer les données du dashboard
export const getDashboardData = query(async () => {
  "use server";
  
  const session = await getSession(authOptions);
  if (!session?.user) {
    throw new Error("Non autorisé");
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email! }
  });

  if (!user) {
    throw new Error("Utilisateur non trouvé");
  }

  const character = await db.character.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      skills: { take: 4 },
      inventory: { take: 3 },
    }
  });

  if (!character) {
    throw new Error("Personnage non trouvé");
  }

  const [completedCount, inProgressCount, failedCount] = await Promise.all([
    db.quest.count({
      where: {
        characterId: character.id,
        status: "COMPLETED",
      },
    }),
    db.quest.count({
      where: {
        characterId: character.id,
        status: "IN_PROGRESS",
      },
    }),
    db.quest.count({
      where: {
        characterId: character.id,
        status: "FAILED",
      },
    }),
  ]);

  return {
    ...character,
    quests: {
      completed: completedCount,
      inProgress: inProgressCount,
      failed: failedCount,
    },
  } as CharacterDashboardType;
}, "dashboard");

// Action pour mettre à jour les attributs
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
      success: "Attributs améliorés avec succès.",
      data: {
        endurance: updatedCharacter.endurance,
        strength: updatedCharacter.strength,
        intelligence: updatedCharacter.intelligence,
        availablePoints: updatedCharacter.availablePoints,
      }
    };
  } catch (err) {
    console.error(err);
    return { error: "Une erreur inattendue s'est produite. Veuillez réessayer." };
  }
}, "upgradeAttributes");

export default function DashboardLayout() {
  const character = createAsync(() => getDashboardData());
  const upgradeAttributesAction = useAction(upgradeAttributes);
  const [searchParams] = useSearchParams();
  const toast = useToast();

  // État local pour les attributs modifiables
  const [attributes, setAttributes] = createSignal<AttributesType | null>(null);

  // Initialiser les attributs quand le personnage est chargé
  createMemo(() => {
    const char = character();
    if (char && !attributes()) {
      setAttributes({
        availablePoints: char.availablePoints,
        endurance: char.endurance,
        intelligence: char.intelligence,
        strength: char.strength,
      });
    }
  });

  const expPercentage = createMemo(() => {
    const char = character();
    if (!char) return 0;
    if (char.maxExpNeeded === 0) return 100;
    return (char.experience / char.maxExpNeeded) * 100;
  });

  const handleAttributeDecrement = (key: keyof Omit<AttributesType, 'availablePoints'>) => {
    const char = character();
    const attrs = attributes();
    if (!char || !attrs) return;
    
    const isAllowed = attrs[key] > char[key];
    if (isAllowed) {
      setAttributes({
        ...attrs,
        [key]: attrs[key] - 1,
        availablePoints: attrs.availablePoints + 1
      });
    }
  };

  const handleAttributeIncrement = (key: keyof Omit<AttributesType, 'availablePoints'>) => {
    const attrs = attributes();
    if (!attrs) return;
    
    const isAvailable = attrs.availablePoints > 0;
    if (isAvailable) {
      setAttributes({
        ...attrs,
        [key]: attrs[key] + 1,
        availablePoints: attrs.availablePoints - 1
      });
    }
  };

  return (
    <Layout>
      <div class="container mx-auto h-full px-4 py-8">
        <
          when={character() && attributes()}
          fallback={
            <Show
              when={character.error?.message === "Personnage non trouvé"}
              fallback={
                <div class="h-full flex justify-center items-center">
                  <LoadingSpinner size="large" message="Veuillez patienter..." />
                </div>
              }
            >
              <Navigate href="/character/create" />
            </Show>
          }
        >
          {(char) => (
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Reste du contenu du dashboard... */}
              {/* Je ne répète pas tout le JSX pour économiser de l'espace, mais il reste identique */}
            </div>
          )}
        </>
      </div>
    </Layout>
  );
}