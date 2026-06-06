import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type Coordinates = [number, number];

type PlaceLike = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  address?: string;
  description?: string;
  location?: {
    type?: string;
    coordinates?: Coordinates;
  };
};

type ItineraryItemLike = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  address?: string;
  time?: string;
  hour?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  place?: PlaceLike;
  placeId?: PlaceLike;
  location?: {
    type?: string;
    coordinates?: Coordinates;
  };
};

type ItineraryDayLike = {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  date?: string;
  day?: number;
  places?: ItineraryItemLike[];
  items?: ItineraryItemLike[];
};

export type ItineraryPdfData = {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  destination?: string;
  days?: ItineraryDayLike[];
  items?: ItineraryItemLike[];
};

function escapeHtml(value?: string | number | null) {
  if (value === undefined || value === null) return '';

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getPlace(item: ItineraryItemLike): PlaceLike {
  return item.place || item.placeId || item;
}

function getItemTime(item: ItineraryItemLike) {
  if (item.startTime && item.endTime) {
    return `${item.startTime} - ${item.endTime}`;
  }

  return item.time || item.hour || item.startTime || '';
}

function getCoordinates(item: ItineraryItemLike): Coordinates | undefined {
  const place = getPlace(item);

  return (
    place.location?.coordinates ||
    item.location?.coordinates
  );
}

function getMapsUrl(item: ItineraryItemLike) {
  const coordinates = getCoordinates(item);

  if (!coordinates || coordinates.length < 2) {
    const place = getPlace(item);
    const query = encodeURIComponent(
      place.address || place.name || item.address || item.name || ''
    );

    if (!query) return null;

    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  const [lng, lat] = coordinates;

  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function normalizeDays(itinerary: ItineraryPdfData): ItineraryDayLike[] {
  if (itinerary.days && itinerary.days.length > 0) {
    return itinerary.days;
  }

  if (itinerary.items && itinerary.items.length > 0) {
    return [
      {
        title: 'Dia 1',
        day: 1,
        items: itinerary.items,
      },
    ];
  }

  return [];
}

function renderItem(item: ItineraryItemLike, index: number) {
  const place = getPlace(item);

  const name =
    place.name ||
    place.title ||
    item.name ||
    item.title ||
    `Local ${index + 1}`;

  const address = place.address || item.address || '';
  const description = place.description || item.notes || '';
  const time = getItemTime(item);
  const mapsUrl = getMapsUrl(item);

  return `
    <div class="place-card">
      <div class="place-header">
        <div class="place-number">${index + 1}</div>
        <div>
          <h3>${escapeHtml(name)}</h3>
          ${
            time
              ? `<p class="time">Horário: ${escapeHtml(time)}</p>`
              : `<p class="time muted">Horário não informado</p>`
          }
        </div>
      </div>

      ${
        address
          ? `<p class="address"><strong>Endereço:</strong> ${escapeHtml(address)}</p>`
          : ''
      }

      ${
        description
          ? `<p class="description">${escapeHtml(description)}</p>`
          : ''
      }

      ${
        mapsUrl
          ? `<a class="map-button" href="${mapsUrl}">Abrir no Google Maps</a>`
          : ''
      }
    </div>
  `;
}

function buildPdfHtml(itinerary: ItineraryPdfData) {
  const title = itinerary.title || itinerary.name || 'Meu roteiro';
  const destination = itinerary.destination || '';
  const days = normalizeDays(itinerary);
  const generatedAt = new Date().toLocaleDateString('pt-BR');

  const daysHtml = days
    .map((day, dayIndex) => {
      const items = day.places || day.items || [];

      const dayTitle =
        day.title ||
        day.name ||
        (day.day ? `Dia ${day.day}` : `Dia ${dayIndex + 1}`);

      return `
        <section class="day-section">
          <h2>${escapeHtml(dayTitle)}</h2>

          ${
            day.date
              ? `<p class="day-date">${escapeHtml(day.date)}</p>`
              : ''
          }

          ${
            items.length > 0
              ? items.map(renderItem).join('')
              : `<p class="empty">Nenhum local adicionado neste dia.</p>`
          }
        </section>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 28px;
            font-family: Arial, Helvetica, sans-serif;
            color: #1f2937;
            background: #ffffff;
          }

          .header {
            padding: 22px;
            border-radius: 18px;
            background: #0f172a;
            color: #ffffff;
            margin-bottom: 24px;
          }

          .app-name {
            font-size: 13px;
            opacity: 0.8;
            margin-bottom: 8px;
          }

          h1 {
            font-size: 28px;
            margin: 0;
          }

          .subtitle {
            margin-top: 8px;
            font-size: 14px;
            opacity: 0.9;
          }

          .day-section {
            margin-bottom: 28px;
            page-break-inside: avoid;
          }

          h2 {
            font-size: 22px;
            margin: 0 0 6px;
            color: #0f172a;
          }

          .day-date {
            margin: 0 0 14px;
            color: #64748b;
            font-size: 13px;
          }

          .place-card {
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 16px;
            margin: 14px 0;
            background: #f8fafc;
            page-break-inside: avoid;
          }

          .place-header {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .place-number {
            width: 34px;
            height: 34px;
            border-radius: 17px;
            background: #2563eb;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            flex-shrink: 0;
            text-align: center;
            line-height: 34px;
          }

          h3 {
            margin: 0;
            font-size: 17px;
            color: #111827;
          }

          .time {
            margin: 4px 0 0;
            font-size: 13px;
            color: #2563eb;
            font-weight: bold;
          }

          .muted {
            color: #94a3b8;
            font-weight: normal;
          }

          .address,
          .description {
            font-size: 13px;
            line-height: 1.45;
            margin: 12px 0 0;
            color: #374151;
          }

          .map-button {
            display: inline-block;
            margin-top: 14px;
            padding: 9px 12px;
            border-radius: 10px;
            background: #2563eb;
            color: #ffffff;
            text-decoration: none;
            font-size: 13px;
            font-weight: bold;
          }

          .empty {
            color: #64748b;
            font-size: 14px;
          }

          .footer {
            margin-top: 36px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            color: #64748b;
            font-size: 12px;
            text-align: center;
          }
        </style>
      </head>

      <body>
        <header class="header">
          <div class="app-name">Turistando</div>
          <h1>${escapeHtml(title)}</h1>
          ${
            destination
              ? `<div class="subtitle">Destino: ${escapeHtml(destination)}</div>`
              : ''
          }
          <div class="subtitle">Gerado em ${escapeHtml(generatedAt)}</div>
        </header>

        ${
          days.length > 0
            ? daysHtml
            : `<p class="empty">Este roteiro ainda não possui locais adicionados.</p>`
        }

        <footer class="footer">
          Roteiro gerado pelo aplicativo Turistando.
        </footer>
      </body>
    </html>
  `;
}

export async function shareItineraryPdf(itinerary: ItineraryPdfData) {
  const html = buildPdfHtml(itinerary);

  const file = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error('Compartilhamento não disponível neste dispositivo.');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Compartilhar roteiro',
    UTI: 'com.adobe.pdf',
  });
}