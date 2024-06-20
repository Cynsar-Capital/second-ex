// pages/profile.js
import ProfileComponent from "@/components/profile";
import GhostContentAPI from "@tryghost/content-api";

import { create } from "./actions/email";

// Initialize the Ghost Content API client
const api = new GhostContentAPI({
  url: process.env.GHOST_URL as string,
  key: process.env.GHOST_KEY as string,
  makeRequest: async ({ url, method, params, headers }) => {
    const apiUrl = new URL(url);

    Object.keys(params).map((key) =>
      apiUrl.searchParams.set(key, encodeURIComponent(params[key])),
    );

    try {
      const response = await fetch(apiUrl.toString(), { method, headers });
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error(error);
    }
  },
  version: "v5.0",
});

// Fetch data from the Ghost API server-side
export async function getData() {
  return await api.posts
    .browse({
      limit: "5",
      include: ["authors", "tags"],
    })
    .catch((err) => {
      console.error(err);
    });
}

export async function getAuthorData() {
  return await api.authors
    .read({
      id: "1",
    })
    .catch((err) => {
      console.error(err);
    });
}

export default async function Profile() {
  const posts = await getData();
  const author = await getAuthorData();

  return <ProfileComponent posts={posts} author={author} create={create} />;
}
