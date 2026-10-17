import type { Metadata } from "next";
import { MyDioramas } from "@/features/dioramas/components/MyDioramas";

export const metadata: Metadata = {
  title: "My Dioramas",
  description: "Every diorama you have built in this browser.",
};

export default function MyDioramasPage() {
  return <MyDioramas />;
}
