import { DioramaRedirect } from "@/features/dioramas/components/DioramaRedirect";

/** The editor's old address: opens the most recently edited diorama, or a new one from the hero starter. */
export default function LatestDioramaPage() {
  return <DioramaRedirect to="latest" />;
}
