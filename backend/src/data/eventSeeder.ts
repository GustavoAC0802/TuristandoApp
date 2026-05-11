import mongoose from "mongoose";
import dotenv from "dotenv";

import Event from "../models/Event";
import Place from "../models/Place";

dotenv.config();

async function seedEvents() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);

    console.log("MongoDB conectado");

    await Event.deleteMany();

    const places = await Place.find();

    const getPlaceByName = (name: string) =>
      places.find((place) => place.name === name);

    const ibirapuera = getPlaceByName("Parque Ibirapuera");
    const masp = getPlaceByName("MASP");
    const museuAmanha = getPlaceByName("Museu do Amanhã");
    const cristo = getPlaceByName("Cristo Redentor");
    const becoBatman = getPlaceByName("Beco do Batman");

    const events = [
      {
        title: "Festival de Música no Ibirapuera",
        description:
          "Evento com shows ao ar livre, food trucks e atividades culturais.",
        place: ibirapuera?._id,
        placeName: ibirapuera?.name,
        city: ibirapuera?.city,
        address: ibirapuera?.address,
        date: new Date("2026-06-15"),
        startTime: "14:00",
        endTime: "22:00",
        category: "música",
        isFree: true,
        image:
          "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200",
      },

      {
        title: "Exposição de Arte Moderna",
        description:
          "Nova exposição com obras contemporâneas brasileiras e internacionais.",
        place: masp?._id,
        placeName: masp?.name,
        city: masp?.city,
        address: masp?.address,
        date: new Date("2026-06-20"),
        startTime: "10:00",
        endTime: "18:00",
        category: "arte",
        isFree: false,
        image:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200",
      },

      {
        title: "Semana da Tecnologia e Inovação",
        description:
          "Palestras, experiências imersivas e atividades interativas.",
        place: museuAmanha?._id,
        placeName: museuAmanha?.name,
        city: museuAmanha?.city,
        address: museuAmanha?.address,
        date: new Date("2026-07-01"),
        startTime: "09:00",
        endTime: "20:00",
        category: "tecnologia",
        isFree: true,
        image:
          "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200",
      },

      {
        title: "Caminhada Histórica no Corcovado",
        description:
          "Passeio guiado contando a história do Cristo Redentor.",
        place: cristo?._id,
        placeName: cristo?.name,
        city: cristo?.city,
        address: cristo?.address,
        date: new Date("2026-06-28"),
        startTime: "08:00",
        endTime: "12:00",
        category: "turismo",
        isFree: false,
        image:
          "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1200",
      },

      {
        title: "Festival de Grafite e Cultura Urbana",
        description:
          "Evento com artistas urbanos, música e exposições de grafite.",
        place: becoBatman?._id,
        placeName: becoBatman?.name,
        city: becoBatman?.city,
        address: becoBatman?.address,
        date: new Date("2026-07-10"),
        startTime: "13:00",
        endTime: "23:00",
        category: "arte",
        isFree: true,
        image:
          "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1200",
      },
    ];

    const validEvents = events.filter((event) => event.place);

    await Event.insertMany(validEvents);

    console.log("Eventos inseridos com sucesso");
    process.exit();
  } catch (error) {
    console.log("Erro ao popular eventos:", error);
    process.exit(1);
  }
}

seedEvents();