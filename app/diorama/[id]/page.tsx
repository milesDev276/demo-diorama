import { EditorRoute } from "@/features/diorama/components/EditorRoute";

export default async function DioramaEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditorRoute dioramaId={id} />;
}
