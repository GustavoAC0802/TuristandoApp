import { Request, Response } from 'express';
import AccessibilityReview from '../models/AcessibilityReview';

type AccessibilityField =
  | 'adaptedBathroom'
  | 'rampAccess'
  | 'elevatorAccess'
  | 'tactilePaving'
  | 'accessibleParking';

const fields: AccessibilityField[] = [
  'adaptedBathroom',
  'rampAccess',
  'elevatorAccess',
  'tactilePaving',
  'accessibleParking',
];

const validAvailability = ['yes', 'no', 'unknown'];
const validQuality = ['good', 'partial', 'bad', 'unknown'];

function getUserIdFromRequest(req: Request) {
  return (
    (req as any).userId ||
    (req as any).user?.id ||
    (req as any).user?._id ||
    (req as any).user?.userId
  );
}

export async function createOrUpdateAccessibilityReview(
  req: Request,
  res: Response
) {
  try {
    const { placeId } = req.params;
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const data: any = {};

    for (const field of fields) {
      const qualityField = `${field}Quality`;

      if (req.body[field]) {
        if (!validAvailability.includes(req.body[field])) {
          return res.status(400).json({
            message: `Valor inválido para ${field}`,
          });
        }

        data[field] = req.body[field];

        if (req.body[field] !== 'yes') {
          data[qualityField] = 'unknown';
        }
      }

      if (req.body[qualityField]) {
        if (!validQuality.includes(req.body[qualityField])) {
          return res.status(400).json({
            message: `Valor inválido para ${qualityField}`,
          });
        }

        data[qualityField] = req.body[qualityField];
      }
    }

    if (req.body.comment !== undefined) {
      data.comment = req.body.comment;
    }

    const review = await AccessibilityReview.findOneAndUpdate(
      { userId, placeId },
      {
        userId,
        placeId,
        ...data,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json(review);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Erro ao salvar avaliação de acessibilidade',
    });
  }
}

export async function getAccessibilitySummary(req: Request, res: Response) {
  try {
    const { placeId } = req.params;

    const reviews = await AccessibilityReview.find({ placeId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    const summary: any = {
      total: reviews.length,
    };

    for (const field of fields) {
      summary[field] = {
        yes: 0,
        no: 0,
        unknown: 0,
      };

      summary[`${field}Quality`] = {
        good: 0,
        partial: 0,
        bad: 0,
        unknown: 0,
      };
    }

    reviews.forEach((review: any) => {
      for (const field of fields) {
        const availability = review[field] || 'unknown';
        const quality = review[`${field}Quality`] || 'unknown';

        summary[field][availability]++;

        if (availability === 'yes') {
          summary[`${field}Quality`][quality]++;
        }
      }
    });

    const comments = reviews
      .filter((review: any) => review.comment && review.comment.trim() !== '')
      .map((review: any) => ({
        _id: review._id,
        comment: review.comment,
        user: review.userId,
        createdAt: review.createdAt,
      }));

    return res.status(200).json({
      summary,
      comments,
      reviews,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Erro ao buscar avaliações de acessibilidade',
    });
  }
}

export async function getMyAccessibilityReview(req: Request, res: Response) {
  try {
    const { placeId } = req.params;
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const review = await AccessibilityReview.findOne({ userId, placeId });

    return res.status(200).json(review);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Erro ao buscar sua avaliação de acessibilidade',
    });
  }
}