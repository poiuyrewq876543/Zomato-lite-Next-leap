import { redirect } from "next/navigation";

/** The first release has exactly one restaurant. */
export default function HomePage() {
  redirect("/restaurant/1");
}
