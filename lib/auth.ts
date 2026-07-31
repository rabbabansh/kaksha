import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Get the server session with auth options
 * Use this instead of getServerSession() directly
 */
export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function getUserProfile() {
  const session = await getAuthSession();
  if (!session?.user?.email) return null;
  const prisma = (await import('@/lib/prisma')).default;
  return await prisma.userProfile.findFirst({
    where: { user: { email: session.user.email } }
  });
}

