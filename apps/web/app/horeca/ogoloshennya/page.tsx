import type { Metadata } from "next";
import { ProjectListingsPage } from "@/lib/project-listings-page";

const PROJECT = "horeca";

export const metadata: Metadata = {
  title: "Horeca — вакансії по всій Україні",
  description:
    "Вакансії для ресторанів, кафе, барів та готелів — оберіть місто та знайдіть роботу",
};

export default function HorecaAllListingsPage() {
  return <ProjectListingsPage project={PROJECT} />;
}
