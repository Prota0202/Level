import { createAsync, query } from "@solidjs/router";

const getUsers = query(async () => {
  "use server";

  return { ok: 'ok' };
}, "users");

export const route = {
  preload: () => getUsers(),
};

export default function LoginCard() {
  const users = createAsync(() => getUsers());

  console.log(users());

  return (
    <div>OK</div>
  )
}
