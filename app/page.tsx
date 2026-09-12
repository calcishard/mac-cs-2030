import { Home } from "@/components/home";
import { getHomeData } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { people, survey } = await getHomeData();
  return <Home people={people} survey={survey} />;
}
