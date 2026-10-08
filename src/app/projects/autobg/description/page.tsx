import type { Metadata } from "next";
import ProjectDocument from "@/components/documents/ProjectDocument";
import { autobgDocument } from "@/content/projectDocuments";

export const metadata: Metadata = {
  title: "AutoBG / Technical study - Abdul Moiz",
  description: autobgDocument.abstract,
};

export default function AutobgDescription() {
  return <ProjectDocument document={autobgDocument} />;
}
