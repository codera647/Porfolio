import type { Metadata } from "next";
import ProjectDocument from "@/components/documents/ProjectDocument";
import { trailforgeDocument } from "@/content/trailforgeDocument";

export const metadata: Metadata = { title: "Trailforge / Technical study — Abdul Moiz", description: trailforgeDocument.abstract };
export default function TrailforgeDescription() { return <ProjectDocument document={trailforgeDocument} />; }
