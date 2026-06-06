import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import PlaceModel from './Models/placeModel';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'turistando_offline',
  jsi: false,
  onSetUpError: (error: unknown) => {
    console.error('Erro ao configurar WatermelonDB:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [PlaceModel],
});