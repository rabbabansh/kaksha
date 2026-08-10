import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  let userId = (session.user as { id?: string })?.id;
  
  // Fallback to fetch by email if id is not directly in the session
  if (!userId && session.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (dbUser) {
      userId = dbUser.id;
    }
  }

  return userId || null;
}
