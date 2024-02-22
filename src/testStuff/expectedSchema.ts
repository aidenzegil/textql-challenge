import { TableSchema } from './testQueries.js';

export const EXPECTED_SCHEMA: TableSchema = {
  tableName: 'user',
  columns: [
    {
      columnName: 'balanceDollars',
      columnType: 'number',
    },
    {
      columnName: 'age',
      columnType: 'number',
    },
    {
      columnName: 'eyeColor',
      columnType: 'string',
    },
    {
      columnName: 'firstName',
      columnType: 'string',
    },
    {
      columnName: 'lastName',
      columnType: 'string',
    },
    {
      columnName: 'gender',
      columnType: 'string',
    },
    {
      columnName: 'email',
      columnType: 'string',
    },
    {
      columnName: 'latitude',
      columnType: 'number',
    },
    {
      columnName: 'longitude',
      columnType: 'number',
    },
  ],
};
