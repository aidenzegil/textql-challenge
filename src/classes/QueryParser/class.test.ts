import { TEST_QUERIES } from '../../testStuff/testQueries.js';
import ConditionParser from './class.js';
import { PARSED_DATA } from '../../testStuff/expectedParsedData.js';

describe('main test', () => {
  for (const q of TEST_QUERIES) {
    const parsedData = PARSED_DATA;

    it(`should execute`, () => {
      const parser = new ConditionParser(q.input, { data: parsedData });

      try {
        const filteredData = parser.parse();

        if (filteredData.length !== q.expectedFilteredRows?.length) {
          console.error(
            '\n\nFILTERED_DATA:\n',
            JSON.stringify(filteredData, null, 2),
          );
        }

        expect(filteredData.length).toEqual(q.expectedFilteredRows.length);
      } catch (e) {
        const error = e as Error;
        // eslint-disable-next-line jest/no-conditional-expect
        expect(error.message).toEqual(q.shouldFailWithError);
      }
    });
  }
});
