import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Get the server session with auth options
 * Use this instead of getServerSession() directly
 */
export async function getAuthSession() {
  return await getServerSession(authOptions);
}

