import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class PlaceModel extends Model {
  static table = 'places';

  @text('server_id')
  serverId!: string;

  @text('name')
  name!: string;

  @text('city')
  city!: string;

  @text('description')
  description!: string;

  @text('address')
  address!: string;

  @text('categories_json')
  categoriesJson!: string;

  @text('image')
  image!: string;

  @text('images_json')
  imagesJson!: string;

  @text('website')
  website!: string;

  @text('contact')
  contact!: string;

  @text('opening_hours')
  openingHours!: string;

  @field('latitude')
  latitude!: number;

  @field('longitude')
  longitude!: number;

  @field('average_rating')
  averageRating!: number;

  @field('reviews_count')
  reviewsCount!: number;

  @field('cached_at')
  cachedAt!: number;
}