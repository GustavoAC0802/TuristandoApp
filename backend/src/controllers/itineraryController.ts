import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Itinerary from '../models/Itinerary';
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

function getParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] || '';
  }

  return value || '';
}

function isValidObjectId(id: string | string[] | undefined): boolean {
  const value = getParamValue(id);
  return mongoose.Types.ObjectId.isValid(value);
}

function sortPlacesByOrder(days: any[]) {
  return days.map((day) => ({
    ...day,
    places: [...(day.places || [])].sort((a: any, b: any) => a.order - b.order),
  }));
}

export async function createItinerary(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const { title, days } = req.body;

    const itinerary = await Itinerary.create({
      user: userId,
      title: title?.trim() || 'Meu roteiro',
      days:
        Array.isArray(days) && days.length > 0
          ? days
          : [
              {
                day: 1,
                places: [],
              },
            ],
    });

    const created = await Itinerary.findById(itinerary._id).populate(
      'days.places.place'
    );

    return res.status(201).json(created);
  } catch (error) {
    console.error('Erro ao criar roteiro:', error);
    return res.status(500).json({ message: 'Erro ao criar roteiro.' });
  }
}

export async function getMyItineraries(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const itineraries = await Itinerary.find({ user: userId })
      .populate('days.places.place')
      .sort({ updatedAt: -1 });

    return res.json(itineraries);
  } catch (error) {
    console.error('Erro ao buscar roteiros:', error);
    return res.status(500).json({ message: 'Erro ao buscar roteiros.' });
  }
}

export async function getItineraryById(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const id = getParamValue(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID do roteiro inválido.' });
    }

    const itinerary = await Itinerary.findOne({
      _id: id,
      user: userId,
    }).populate('days.places.place');

    if (!itinerary) {
      return res.status(404).json({ message: 'Roteiro não encontrado.' });
    }

    const response = itinerary.toObject();
    response.days = sortPlacesByOrder(response.days);

    return res.json(response);
  } catch (error) {
    console.error('Erro ao buscar roteiro:', error);
    return res.status(500).json({ message: 'Erro ao buscar roteiro.' });
  }
}

export async function updateItinerary(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const id = getParamValue(req.params.id);
    const { title, days } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID do roteiro inválido.' });
    }

    const itinerary = await Itinerary.findOne({
      _id: id,
      user: userId,
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Roteiro não encontrado.' });
    }

    if (typeof title === 'string') {
      itinerary.title = title.trim() || 'Meu roteiro';
    }

    if (Array.isArray(days)) {
      const normalizedDays = days.map((dayItem: any) => ({
        day: Number(dayItem.day) > 0 ? Number(dayItem.day) : 1,
        places: Array.isArray(dayItem.places)
          ? dayItem.places
              .map((item: any, index: number) => {
                const rawPlaceId =
                  item.placeId ||
                  item.place ||
                  item._id ||
                  item.place?._id;

                const placeId =
                  typeof rawPlaceId === 'object' && rawPlaceId?._id
                    ? String(rawPlaceId._id)
                    : String(rawPlaceId || '');

                if (!mongoose.Types.ObjectId.isValid(placeId)) {
                  return null;
                }

                return {
                  place: new mongoose.Types.ObjectId(placeId),
                  order: Number(item.order) || index + 1,
                  time: item.time || '',
                  notes: item.notes || '',
                };
              })
              .filter(Boolean)
          : [],
      }));

      itinerary.days = normalizedDays;
    }

    itinerary.days.sort((a, b) => a.day - b.day);

    await itinerary.save();

    const updated = await Itinerary.findById(itinerary._id).populate(
      'days.places.place'
    );

    return res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar roteiro:', error);
    return res.status(500).json({ message: 'Erro ao atualizar roteiro.' });
  }
}

export async function deleteItinerary(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const id = getParamValue(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID do roteiro inválido.' });
    }

    const itinerary = await Itinerary.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Roteiro não encontrado.' });
    }

    return res.json({ message: 'Roteiro removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover roteiro:', error);
    return res.status(500).json({ message: 'Erro ao remover roteiro.' });
  }
}

export async function addPlaceToItinerary(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const id = getParamValue(req.params.id);
    const { placeId, day = 1, time = '', notes = '' } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID do roteiro inválido.' });
    }

    if (!placeId || !mongoose.Types.ObjectId.isValid(String(placeId))) {
      return res.status(400).json({ message: 'ID do local inválido.' });
    }

    const placeExists = await Place.exists({ _id: placeId });

    if (!placeExists) {
      return res.status(404).json({ message: 'Local não encontrado.' });
    }

    const itinerary = await Itinerary.findOne({
      _id: id,
      user: userId,
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Roteiro não encontrado.' });
    }

    const selectedDayNumber = Number(day) > 0 ? Number(day) : 1;

    let selectedDay = itinerary.days.find(
      (item) => item.day === selectedDayNumber
    );

    if (!selectedDay) {
      itinerary.days.push({
        day: selectedDayNumber,
        places: [],
      });

      selectedDay = itinerary.days.find(
        (item) => item.day === selectedDayNumber
      );
    }

    if (!selectedDay) {
      return res.status(500).json({ message: 'Erro ao criar dia do roteiro.' });
    }

    const alreadyAdded = selectedDay.places.some(
      (item) => item.place.toString() === String(placeId)
    );

    if (alreadyAdded) {
      return res.status(400).json({
        message: 'Este local já está nesse dia do roteiro.',
      });
    }

    const nextOrder =
      selectedDay.places.length > 0
        ? Math.max(...selectedDay.places.map((item) => item.order || 0)) + 1
        : 1;

    selectedDay.places.push({
      place: new mongoose.Types.ObjectId(String(placeId)),
      order: nextOrder,
      time,
      notes,
    });

    itinerary.days.sort((a, b) => a.day - b.day);

    await itinerary.save();

    const updated = await Itinerary.findById(itinerary._id).populate(
      'days.places.place'
    );

    return res.status(201).json(updated);
  } catch (error) {
    console.error('Erro ao adicionar local ao roteiro:', error);
    return res
      .status(500)
      .json({ message: 'Erro ao adicionar local ao roteiro.' });
  }
}

export async function removePlaceFromItinerary(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const id = getParamValue(req.params.id);
    const placeId = getParamValue(req.params.placeId);
    const day = Number(req.query.day || 1);

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID do roteiro inválido.' });
    }

    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      return res.status(400).json({ message: 'ID do local inválido.' });
    }

    const itinerary = await Itinerary.findOne({
      _id: id,
      user: userId,
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Roteiro não encontrado.' });
    }

    const selectedDay = itinerary.days.find((item) => item.day === day);

    if (!selectedDay) {
      return res.status(404).json({ message: 'Dia não encontrado no roteiro.' });
    }

    const initialLength = selectedDay.places.length;

    selectedDay.places = selectedDay.places.filter(
      (item) => item.place.toString() !== placeId
    );

    if (selectedDay.places.length === initialLength) {
      return res
        .status(404)
        .json({ message: 'Local não encontrado nesse dia do roteiro.' });
    }

    selectedDay.places = selectedDay.places.map((item, index) => ({
      place: item.place,
      order: index + 1,
      time: item.time || '',
      notes: item.notes || '',
    }));

    await itinerary.save();

    const updated = await Itinerary.findById(itinerary._id).populate(
      'days.places.place'
    );

    return res.json(updated);
  } catch (error) {
    console.error('Erro ao remover local do roteiro:', error);
    return res
      .status(500)
      .json({ message: 'Erro ao remover local do roteiro.' });
  }
}

export async function reorderItineraryPlaces(req: AuthRequest, res: Response) {
  try {
    const userId = getUserId(req);
    const id = getParamValue(req.params.id);
    const { day, places } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID do roteiro inválido.' });
    }

    const selectedDayNumber = Number(day);

    if (!selectedDayNumber || selectedDayNumber < 1) {
      return res.status(400).json({ message: 'Dia inválido.' });
    }

    if (!Array.isArray(places)) {
      return res.status(400).json({
        message: 'A lista de locais precisa ser um array.',
      });
    }

    const itinerary = await Itinerary.findOne({
      _id: id,
      user: userId,
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Roteiro não encontrado.' });
    }

    const selectedDay = itinerary.days.find(
      (item) => item.day === selectedDayNumber
    );

    if (!selectedDay) {
      return res.status(404).json({
        message: 'Dia não encontrado no roteiro.',
      });
    }

    const normalizedPlaces = [];

    for (let index = 0; index < places.length; index++) {
      const item = places[index];

      const rawPlaceId =
        item.placeId ||
        item.place ||
        item._id ||
        item.place?._id;

      const placeId =
        typeof rawPlaceId === 'object' && rawPlaceId?._id
          ? String(rawPlaceId._id)
          : String(rawPlaceId || '');

      if (!mongoose.Types.ObjectId.isValid(placeId)) {
        return res.status(400).json({
          message: `ID do local inválido na posição ${index + 1}.`,
          received: rawPlaceId,
        });
      }

      normalizedPlaces.push({
        place: new mongoose.Types.ObjectId(placeId),
        order: index + 1,
        time: item.time || '',
        notes: item.notes || '',
      });
    }

    selectedDay.places = normalizedPlaces;

    await itinerary.save();

    const updated = await Itinerary.findById(itinerary._id).populate(
      'days.places.place'
    );

    return res.json(updated);
  } catch (error: any) {
    console.error('Erro ao reordenar roteiro:', error);

    return res.status(500).json({
      message: 'Erro ao reordenar roteiro.',
      error: error?.message,
    });
  }
}

export async function createOrGetCurrentItinerary(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    let itinerary = await Itinerary.findOne({
      user: userId,
      title: 'Meu roteiro',
    }).populate('days.places.place');

    if (!itinerary) {
      const created = await Itinerary.create({
        user: userId,
        title: 'Meu roteiro',
        days: [
          {
            day: 1,
            places: [],
          },
        ],
      });

      itinerary = await Itinerary.findById(created._id).populate(
        'days.places.place'
      );
    }

    if (!itinerary) {
      return res.status(500).json({ message: 'Erro ao criar roteiro atual.' });
    }

    const response = itinerary.toObject();
    response.days = sortPlacesByOrder(response.days);

    return res.json(response);
  } catch (error) {
    console.error('Erro ao buscar/criar roteiro atual:', error);
    return res.status(500).json({ message: 'Erro ao buscar roteiro atual.' });
  }
}