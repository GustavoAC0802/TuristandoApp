import api from './api';

export type SearchPlacesParams = {
  search?: string;
  category?: string;
  minRating?: number;
  maxDistance?: number;
  page?: number;
  limit?: number;
  userLat?: number;
  userLng?: number;
};

export async function searchPlaces(params: SearchPlacesParams) {
  const response = await api.get('/places/search', {
    params,
  });

  return response.data;
}