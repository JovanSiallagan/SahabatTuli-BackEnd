import { Request, Response } from "express";
import { friendService, FriendServiceError } from "./friend.service";

export const searchUsers = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, user id not found",
            });
        }

        const keyword = typeof req.query.q === "string" ? req.query.q : "";
        const users = await friendService.searchUsers(userId, keyword);

        return res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error: any) {
        if (error instanceof FriendServiceError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getFriends = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, user id not found",
            });
        }

        const friends = await friendService.getFriends(userId);

        return res.status(200).json({
            success: true,
            data: friends,
        });
    } catch (error: any) {
        if (error instanceof FriendServiceError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const addFriend = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, user id not found",
            });
        }

        const { friendId } = req.body;
        const friend = await friendService.addFriend(userId, friendId);

        return res.status(201).json({
            success: true,
            data: friend,
        });
    } catch (error: any) {
        if (error instanceof FriendServiceError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const removeFriend = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, user id not found",
            });
        }

        const friendId = req.params.friendId as string;
        await friendService.removeFriend(userId, friendId);

        return res.status(200).json({
            success: true,
            message: "Teman berhasil dihapus",
        });
    } catch (error: any) {
        if (error instanceof FriendServiceError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};