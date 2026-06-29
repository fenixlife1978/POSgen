import { redirect } from "next/navigation";

export default function LegacySchoolPage() {
  // Redirigimos al dashboard principal ya que esta ruta ya no pertenece al proyecto de Marketing
  redirect("/dashboard");
}
