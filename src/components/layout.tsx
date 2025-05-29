import { Accessor, createSignal, JSX, onMount } from 'solid-js';
import MobileSidebar from './mobile-sidebar';
import DesktopSidebar from './desktop-sidebar';
import { CharacterSidebar } from '~/lib/types';
import { useNavigate } from '@solidjs/router';

interface IProps {
  children: JSX.Element;
  onCharacterReady?: (refetch: () => Promise<void>) => void;
}

export default function Layout({ children, onCharacterReady }: IProps) {
  const [character, setCharacter] = createSignal<CharacterSidebar | null>(null);
  const navigate = useNavigate();

  const fetchCharacter = async () => {
    try {
      const res = await fetch(`/api/sidebar`);

      switch (res.status) {
        case 200:
          const data = await res.json();
          setCharacter(data);
          break;
        case 404:
          navigate('/404');
          break;
        default:
          const errorData = await res.json();
          throw Error(errorData?.error || 'Internal server error');
      }
    } catch (error) {
      console.error({ error });
      navigate('/500');
    }
  };

  onMount(() => {
    fetchCharacter();

    // Expose refetch function ke parent
    if (onCharacterReady) {
      onCharacterReady(fetchCharacter);
    }
  });

  return (
    <div class="min-h-screen bg-gray-900 text-gray-100 flex">
      <DesktopSidebar character={character} />
      <MobileSidebar character={character} />

      <main class="md:ml-64 flex-1 py-6 md:py-12 min-h-screen pt-20 md:pt-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
