import { JSX, createAsync, query, createMemo } from 'solid-js';
import { getSession } from "@auth/solid-start";
import { authOptions } from "~/routes/api/auth/[...solidauth]";
import { Navigate } from '@solidjs/router';
import { Show } from 'solid-js';
import MobileSidebar from './mobile-sidebar';
import DesktopSidebar from './desktop-sidebar';
import { CharacterSidebar } from '~/lib/types';
import db from '~/lib/db';

interface IProps {
  children: JSX.Element;
  onCharacterReady?: (refetch: () => Promise<void>) => void;
}

// Query pour récupérer les données du layout
export const getLayoutData = query(async () => {
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
    select: {
      name: true,
      class: true,
      level: true,
      user: { select: { name: true } }
    }
  });

  if (!character) {
    throw new Error("Personnage non trouvé");
  }

  return {
    userName: character.user.name!,
    name: character.name,
    class: character.class,
    level: character.level
  } as CharacterSidebar;
}, "layout");

export default function Layout({ children, onCharacterReady }: IProps) {
  const characterData = createAsync(() => getLayoutData());
  
  // Expose refetch function to parent
  createMemo(() => {
    if (onCharacterReady) {
      onCharacterReady(async () => {
        // Force refetch of layout data
        await getLayoutData();
      });
    }
  });

  return (
    <div class="min-h-screen bg-gray-900 text-gray-100 flex">
      <DesktopSidebar character={characterData} />
      <MobileSidebar character={characterData} />

      <main class="md:ml-64 flex-1 py-6 md:py-12 min-h-screen pt-20 md:pt-0 overflow-hidden">
        <Show
          when={!characterData.error}
          fallback={<Navigate href="/character/create" />}
        >
          {children}
        </Show>
      </main>
    </div>
  );
}