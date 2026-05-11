import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review';
import User from '../models/User';

export async function getReviewsByPlace(req: Request, res: Response) {
  try {
    const placeId = String(req.params.placeId);

    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      return res.status(400).json({
        message: 'ID do local inválido.',
      });
    }

    const reviews = await Review.find({
      placeId: new mongoose.Types.ObjectId(placeId),
    }).sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao buscar comentários.',
    });
  }
}

export async function createReview(req: Request, res: Response) {
  try {
    const placeId = String(req.params.placeId);
    const { rating, comment } = req.body;
    const authUser = (req as any).user;

    if (!authUser?.id) {
      return res.status(401).json({
        message: 'Usuário não autenticado.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      return res.status(400).json({
        message: 'ID do local inválido.',
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Avaliação inválida.',
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        message: 'Comentário obrigatório.',
      });
    }

    const user = await User.findById(authUser.id).select('name email');

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado.',
      });
    }

    const review = await Review.create({
      placeId: new mongoose.Types.ObjectId(placeId),
      userId: user._id,
      userName: user.name || user.email || 'Usuário',
      rating,
      comment: comment.trim(),
    });

    return res.status(201).json(review);
  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao criar comentário.',
    });
  }
}

export async function updateReview(req: Request, res: Response) {
  try {
    const reviewId = String(req.params.reviewId);
    const { rating, comment } = req.body;
    const authUser = (req as any).user;

    if (!authUser?.id) {
      return res.status(401).json({
        message: 'Usuário não autenticado.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        message: 'ID do comentário inválido.',
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Avaliação inválida.',
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        message: 'Comentário obrigatório.',
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        message: 'Comentário não encontrado.',
      });
    }

    if (String(review.userId) !== String(authUser.id)) {
      return res.status(403).json({
        message: 'Você não pode editar este comentário.',
      });
    }

    review.rating = rating;
    review.comment = comment.trim();

    await review.save();

    return res.json(review);
  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao editar comentário.',
    });
  }
}

export async function deleteReview(req: Request, res: Response) {
  try {
    const reviewId = String(req.params.reviewId);
    const authUser = (req as any).user;

    if (!authUser?.id) {
      return res.status(401).json({
        message: 'Usuário não autenticado.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        message: 'ID do comentário inválido.',
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        message: 'Comentário não encontrado.',
      });
    }

    if (String(review.userId) !== String(authUser.id)) {
      return res.status(403).json({
        message: 'Você não pode excluir este comentário.',
      });
    }

    await Review.findByIdAndDelete(reviewId);

    return res.json({
      message: 'Comentário excluído com sucesso.',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao excluir comentário.',
    });
  }
}