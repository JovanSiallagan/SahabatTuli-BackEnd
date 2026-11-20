import prisma from "../../config/prisma";

export const friendRepository = {
    async findUserById(userId: string) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        });
    },

    async searchUsers(currentUserId: string, keyword: string) {
        return prisma.user.findMany({
            where: {
                id: { not: currentUserId },
                OR: [
                    { name: { contains: keyword, mode: 'insensitive' } },
                    { email: { contains: keyword, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                sentFriendships: {
                    where: { receiverId: currentUserId },
                    select: { id: true },
                },
                receivedFriendships: {
                    where: { senderId: currentUserId },
                    select: { id: true },
                },
            },
            take: 20,
        });
    },

    async findFriendshipBetween(userIdA: string, userIdB: string) {
        return prisma.friendship.findFirst({
            where: {
                OR: [
                    { senderId: userIdA, receiverId: userIdB },
                    { senderId: userIdB, receiverId: userIdA },
                ],
            },
        });
    },

    async createFriendship(senderId: string, receiverId: string) {
        return prisma.friendship.create({
            data: {
                senderId,
                receiverId,
            },
            include: {
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
        });
    },

    async findAllFriendshipsByUserId(userId: string) {
        return prisma.friendship.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    },

    async deleteFriendshipById(friendshipId: string) {
        return prisma.friendship.delete({
            where: { id: friendshipId },
        });
    },
};