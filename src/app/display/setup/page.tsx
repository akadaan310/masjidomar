import { redirect } from "next/navigation";

// The display setup lives inside the protected administration console.
export default function DisplaySetup() {
  redirect("/admin/display");
}
