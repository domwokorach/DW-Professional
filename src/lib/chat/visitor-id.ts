import { VISITOR_ID_STORAGE_KEY } from "./constants";
import { generateId } from "@/lib/utils/generate-id";

/** The current browser tab's stable visitor id — same value the socket token and every /api/chat/* request are already scoped to. */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "visitor";
  let id = window.sessionStorage.getItem(VISITOR_ID_STORAGE_KEY);
  if (!id) {
    id = generateId();
    window.sessionStorage.setItem(VISITOR_ID_STORAGE_KEY, id);
  }
  return id;
}
