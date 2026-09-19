import { prisma } from '@/lib/db/prisma'
import { createPrismaNewsRepository } from './repository'

export const newsRepository = createPrismaNewsRepository(prisma)
