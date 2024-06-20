"use server";

import { TSGhostAdminAPI } from "@ts-ghost/admin-api";

export async function create(email) {
  // ...
  //
  console.log(FormData);

  const api = new TSGhostAdminAPI(
    process.env.GHOST_URL as string,
    process.env.GHOST_ADMIN_API as string,
    "v5.0",
  );

  await api.members.add({ email: email });
}
