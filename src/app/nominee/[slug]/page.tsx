import { notFound } from "next/navigation";
import { NomineeProfileClient } from "./NomineeProfileClient";
import { nominationsStore } from "@/lib/storage/local-json";

interface NomineePageProps {
  params: { slug: string };
}

export default async function NomineeProfilePage({ params }: NomineePageProps) {
  const { slug } = params;
  
  if (!slug) {
    notFound();
  }

  // Get nominations from local storage
  const nominations = await nominationsStore.list();
  
  // Find nomination by slug
  const nomination = nominations.find(n => n.liveUrl === slug);

  if (!nomination) {
    notFound();
  }

  return <NomineeProfileClient nomination={nomination} />;
}