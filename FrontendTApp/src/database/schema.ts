import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'places',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'city', type: 'string', isOptional: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'address', type: 'string', isOptional: true },
        { name: 'categories_json', type: 'string', isOptional: true },
        { name: 'image', type: 'string', isOptional: true },
        { name: 'images_json', type: 'string', isOptional: true },
        { name: 'website', type: 'string', isOptional: true },
        { name: 'contact', type: 'string', isOptional: true },
        { name: 'opening_hours', type: 'string', isOptional: true },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'average_rating', type: 'number', isOptional: true },
        { name: 'reviews_count', type: 'number', isOptional: true },
        { name: 'cached_at', type: 'number' },
      ],
    }),
  ],
});