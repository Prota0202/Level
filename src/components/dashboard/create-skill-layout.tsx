import { action, redirect, useSubmission } from '@solidjs/router';
import { createSignal, onMount, Show } from 'solid-js';
import { ErrorAlert } from '~/components/error-alert';
import Layout from '~/components/layout';
import db from '~/lib/db';
import { skillSchema } from '~/lib/validation';

const createSkill = action(async (
  userEmail: string,
  formData: FormData
) => {
  "use server";

  const raw = {
    name: formData.get("name"),
    description: formData.get("description"),
    maxLevel: +formData.get("maxLevel")!,
  };

  const parsed = skillSchema.safeParse(raw);

  if (!parsed.success) {
    const errorMessages = parsed.error.errors.map(err => err.message).join(', ');
    return { error: errorMessages };
  }

  try {
    const user = await db.user.findUnique({
      where: { email: userEmail },
      select: {
        character: {
          select: { id: true }
        }
      }
    });

    if (!user || !user.character) {
      return { error: `${!user ? 'User' : 'Character'} not found in our database` }; !user
    }

    await db.skill.create({
      data: {
        ...parsed.data,
        characterId: user.character.id
      },
    });
  } catch (err) {
    console.error(err);
    return { error: "An unexpected error occurred. Please try again." };
  }

  throw redirect('/skills?create_skill=success');
}, "createSkill");

export default function CreateSkillLayout() {
  const submission = useSubmission(createSkill);
  const [userEmail, setUserEmail] = createSignal('');

  onMount(async () => {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    setUserEmail(data?.user.email || '');
  });

  return (
    <Layout>
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-center text-blue-400 mb-8">Add New Skill</h1>

        <div class="max-w-2xl mx-auto bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div class="p-6">
            <form action={createSkill.with(userEmail())} method="post">
              {/* Skill Information */}
              <div class="mb-8">
                <h2 class="text-xl font-bold text-gray-200 mb-6">Skill Information</h2>

                <div class="grid grid-cols-1 gap-6">
                  <div>
                    <label for="name" class="block text-sm font-medium text-gray-300 mb-2">
                      Skill Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter skill name"
                    />
                  </div>

                  <div>
                    <label for="description" class="block text-sm font-medium text-gray-300 mb-2">
                      Skill Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter skill description"
                      required
                    ></textarea>
                  </div>

                  <div>
                    <label for="maxLevel" class="block text-sm font-medium text-gray-300 mb-2">
                      Max Level <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="maxLevel"
                      name="maxLevel"
                      required
                      min="2"
                      class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter max skill level"
                    />
                  </div>
                </div>
              </div>

              <Show when={submission.error || submission.result?.error}>
                <ErrorAlert
                  message={submission.error?.message || submission.result?.error}
                />
              </Show>

              <div class="mt-4 flex justify-end pt-4 border-t border-gray-700">
                <button
                  type="button"
                  class="px-4 py-2 bg-gray-700 text-gray-300 rounded-md mr-3 hover:bg-gray-600"
                  disabled={submission.pending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={submission.pending || !userEmail}
                >
                  {submission.pending ? 'Loading...' : 'Add Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
