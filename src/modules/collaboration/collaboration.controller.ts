import { Request, Response } from "express";
import {
    collaborationService,
    CollaborationServiceError,
} from "./collaboration.service";

export const createRoom = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, user id not found",
            });
        }

        const { title } = req.body;
        const room = await collaborationService.createRoom(userId, title);

        return res.status(201).json({
            success: true,
            data: room,
        });
    } catch (error: any) {
        if (error instanceof CollaborationServiceError) {
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

export const getActiveRooms = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, user id not found",
            });
        }

        const rooms = await collaborationService.getActiveRooms(userId);

        return res.status(200).json({
            success: true,
            data: rooms,
        });
    } catch (error: any) {
        if (error instanceof CollaborationServiceError) {
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

export const getRoomDetail = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, user id not found",
            });
        }

        const roomId = req.params.roomId as string;
        const room = await collaborationService.getRoomDetail(userId, roomId);

        return res.status(200).json({
            success: true,
            data: room,
        });
    } catch (error: any) {
        if (error instanceof CollaborationServiceError) {
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

export const joinRoom = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, user id not found",
            });
        }

        const roomId = req.params.roomId as string;
        const room = await collaborationService.joinRoom(userId, roomId);

        return res.status(200).json({
            success: true,
            data: room,
        });
    } catch (error: any) {
        if (error instanceof CollaborationServiceError) {
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

export const leaveRoom = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, user id not found",
            });
        }

        const roomId = req.params.roomId as string;
        const result = await collaborationService.leaveRoom(userId, roomId);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        if (error instanceof CollaborationServiceError) {
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

export const addTranscript = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, user id not found",
            });
        }

        const roomId = req.params.roomId as string;
        const { text } = req.body;
        const transcript = await collaborationService.saveTranscript(
            userId,
            roomId,
            text
        );

        return res.status(201).json({
            success: true,
            data: transcript,
        });
    } catch (error: any) {
        if (error instanceof CollaborationServiceError) {
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

export const getRoomHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, user id not found",
            });
        }

        const history = await collaborationService.getRoomHistory(userId);

        return res.status(200).json({
            success: true,
            data: history,
        });
    } catch (error: any) {
        if (error instanceof CollaborationServiceError) {
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