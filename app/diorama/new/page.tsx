import { DioramaRedirect } from "@/features/dioramas/components/DioramaRedirect";

/** `/diorama/new?starter=<id>` or `?base=<base>`: creates a diorama and opens it. Used by the home page's links. */
export default function NewDioramaPage() {
  return <DioramaRedirect to="new" />;
}
