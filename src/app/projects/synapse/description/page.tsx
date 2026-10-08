import type { Metadata } from "next";
import ProjectDocument from "@/components/documents/ProjectDocument";
import { synapseDocument } from "@/content/projectDocuments";

export const metadata: Metadata = {
  title: "Synapse / Technical study - Abdul Moiz",
  description: synapseDocument.abstract,
};

export default function SynapseDescription() {
  return <ProjectDocument document={synapseDocument} />;
}
