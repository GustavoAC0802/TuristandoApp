import { Request, Response } from 'express';
import mongoose from 'mongoose';
import CheckIn from '../models/CheckIn';
import Place from '../models/Place';

type AuthRequest = Request & {
  user?: {
    id?: string;
    _id?: string;
  };
};

function getUserId(req: AuthRequest): string | undefined {
  return req.user?.id || req.user?._id;
}

function getBadge(total: number) {
  if (total >= 10) {
    return {
      title: 'Turista experiente',
      description: 'Você fez check-in em 10 ou mais locais.',
    };
  }

  if (total >= 5) {
    return {
      title: 'Explorador',
      description: 'Você fez check-in em 5 ou mais locais.',
    };
  }

  if (total >= 1) {
    return {
      title: 'Primeiro passeio',
      description: 'Você fez seu primeiro check-in.',
    };
  }

  return null;
}

export async function createCheckIn(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const placeId = req.body.placeId;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (!placeId || typeof placeId !== 'string') {
      return res.status(400).json({ message: 'O placeId é obrigatório.' });
    }

    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      return res.status(400).json({ message: 'placeId inválido.' });
    }

    const placeExists = await Place.findById(placeId);

    if (!placeExists) {
      return res.status(404).json({ message: 'Local não encontrado.' });
    }

    const alreadyCheckedIn = await CheckIn.findOne({
      userId,
      placeId,
    });

    if (alreadyCheckedIn) {
      const totalCheckIns = await CheckIn.countDocuments({ userId });

      return res.status(200).json({
        message: 'Você já fez check-in neste local.',
        alreadyCheckedIn: true,
        checkIn: alreadyCheckedIn,
        stats: {
          totalCheckIns,
          points: totalCheckIns * 10,
          badge: getBadge(totalCheckIns),
        },
      });
    }

    const checkIn = await CheckIn.create({
      userId,
      placeId,
    });

    const totalCheckIns = await CheckIn.countDocuments({ userId });

    return res.status(201).json({
      message: 'Check-in realizado com sucesso.',
      alreadyCheckedIn: false,
      checkIn,
      stats: {
        totalCheckIns,
        points: totalCheckIns * 10,
        badge: getBadge(totalCheckIns),
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Você já fez check-in neste local.',
      });
    }

    return res.status(500).json({
      message: 'Erro ao realizar check-in.',
      error: error.message,
    });
  }
}

export async function getMyCheckIns(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const checkIns = await CheckIn.find({ userId })
      .populate('placeId')
      .sort({ createdAt: -1 });

    const totalCheckIns = checkIns.length;

    return res.status(200).json({
      checkIns,
      stats: {
        totalCheckIns,
        points: totalCheckIns * 10,
        badge: getBadge(totalCheckIns),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Erro ao buscar check-ins.',
      error: error.message,
    });
  }
}

export async function getCheckInStatus(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const placeId = req.params.placeId;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (!placeId || !mongoose.isValidObjectId(placeId)) {
      return res.status(400).json({ message: 'placeId inválido.' });
    }

    const checkIn = await CheckIn.findOne({
      userId,
      placeId,
    });

    return res.status(200).json({
      checkedIn: !!checkIn,
      checkIn,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Erro ao verificar check-in.',
      error: error.message,
    });
  }
}

export async function getPlaceCheckIns(req: Request, res: Response) {
  try {
    const placeId = req.params.placeId;

    if (!placeId || !mongoose.isValidObjectId(placeId)) {
      return res.status(400).json({ message: 'placeId inválido.' });
    }

    const total = await CheckIn.countDocuments({ placeId });

    return res.status(200).json({
      placeId,
      totalCheckIns: total,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Erro ao buscar check-ins do local.',
      error: error.message,
    });
  }
}