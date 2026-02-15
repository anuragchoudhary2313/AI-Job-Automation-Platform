import { loadSkills } from "skills";

export async function getSkills() {
  try {
    return await loadSkills();
  } catch (error) {
    console.error("Skills failed to load:", error);
    return [];
  }
}
