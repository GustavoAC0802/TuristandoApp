import { Request, Response } from "express";
import Event from "../models/Event";

export async function getEvents(req: Request, res: Response) {
  try {
    const {
      city,
      placeId,
      category,
      upcoming = "true",
    } = req.query;

    const filters: any = {};

    if (city) {
      filters.city = city;
    }

    if (placeId) {
      filters.place = placeId;
    }

    if (category) {
      filters.category = category;
    }

    if (upcoming === "true") {
      filters.date = {
        $gte: new Date(),
      };
    }

    const events = await Event.find(filters)
      .sort({ date: 1 })
      .limit(20);

    return res.status(200).json(events);
  } catch (error) {
    console.log("Erro ao buscar eventos:", error);

    return res.status(500).json({
      message: "Erro ao buscar eventos",
    });
  }
}

export async function getEventById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento não encontrado",
      });
    }

    return res.status(200).json(event);
  } catch (error) {
    console.log("Erro ao buscar evento:", error);

    return res.status(500).json({
      message: "Erro ao buscar evento",
    });
  }
}

export async function createEvent(req: Request, res: Response) {
  try {
    const event = await Event.create(req.body);

    return res.status(201).json(event);
  } catch (error) {
    console.log("Erro ao criar evento:", error);

    return res.status(500).json({
      message: "Erro ao criar evento",
    });
  }
}

export async function deleteEvent(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({
        message: "Evento não encontrado",
      });
    }

    return res.status(200).json({
      message: "Evento removido com sucesso",
    });
  } catch (error) {
    console.log("Erro ao remover evento:", error);

    return res.status(500).json({
      message: "Erro ao remover evento",
    });
  }
}