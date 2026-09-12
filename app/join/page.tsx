import type { Metadata } from "next";
import { JoinForm } from "@/components/join/join-form";

export const metadata: Metadata = {
  title: "add yourself · Mac CS 2030",
  description: "Add your polaroid to the Mac CS ’30 board and fill in the class profile.",
};

export default function JoinPage() {
  return <JoinForm />;
}
