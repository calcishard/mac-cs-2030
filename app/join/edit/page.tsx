import type { Metadata } from "next";
import { EditPolaroid } from "@/components/join/edit-polaroid";

export const metadata: Metadata = {
  title: "edit your polaroid · Mac CS 2030",
  robots: { index: false, follow: false },
};

export default function EditPolaroidPage() {
  return <EditPolaroid />;
}
