import type { Metadata } from "next";
import ProjectDocument from "@/components/documents/ProjectDocument";
import { contentforgeDocument } from "@/content/contentforgeDocument";

export const metadata: Metadata = {
  title: "ContentForge AI / Technical study — Abdul Moiz",
  description: contentforgeDocument.abstract,
};

export default function ContentforgeDescription() {
  return <ProjectDocument document={contentforgeDocument} />;
}
