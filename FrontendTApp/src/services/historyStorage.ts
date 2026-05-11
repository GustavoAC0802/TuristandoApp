import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = '@turistando:search_history';
const RECENT_PLACES_KEY = '@turistando:recent_places';

export type RecentPlace = {
  _id: string;
  name: string;
  address?: string;
  image?: string;
  categories?: string[];
};

const MAX_SEARCH_ITEMS = 4;
const MAX_RECENT_PLACES = 10;

export async function getSearchHistory(): Promise<string[]> {
  const data = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

export async function addSearchHistory(searchText: string): Promise<void> {
  const text = searchText.trim();

  if (!text) return;

  const currentHistory = await getSearchHistory();

  const updatedHistory = [
    text,
    ...currentHistory.filter(
      (item) => item.toLowerCase() !== text.toLowerCase()
    ),
  ].slice(0, MAX_SEARCH_ITEMS);

  await AsyncStorage.setItem(
    SEARCH_HISTORY_KEY,
    JSON.stringify(updatedHistory)
  );
}

export async function clearSearchHistory(): Promise<void> {
  await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
}

export async function getRecentPlaces(): Promise<RecentPlace[]> {
  const data = await AsyncStorage.getItem(RECENT_PLACES_KEY);
  return data ? JSON.parse(data) : [];
}

export async function addRecentPlace(place: RecentPlace): Promise<void> {
  if (!place?._id) return;

  const currentPlaces = await getRecentPlaces();

  const updatedPlaces = [
    {
      _id: place._id,
      name: place.name,
      address: place.address,
      image: place.image,
      categories: place.categories ?? [],
    },
    ...currentPlaces.filter((item) => item._id !== place._id),
  ].slice(0, MAX_RECENT_PLACES);

  await AsyncStorage.setItem(
    RECENT_PLACES_KEY,
    JSON.stringify(updatedPlaces)
  );
}

export async function clearRecentPlaces(): Promise<void> {
  await AsyncStorage.removeItem(RECENT_PLACES_KEY);
}