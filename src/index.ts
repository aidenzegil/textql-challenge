/* eslint-disable @typescript-eslint/no-explicit-any */
import * as readline from 'readline';
import * as fs from 'fs';
import ConditionParser from './classes/QueryParser/class.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(): void {
  rl.question('Type your query here:', (query) => {
    const dataFile = fs.readFileSync('data.json', 'utf8');
    const data = JSON.parse(dataFile.toString());
    try {
      const parser = new ConditionParser(query, { data });
      const results = parser.parse();
      console.info(results);
      rl.close();
    } catch (e) {
      console.error(e);
      rl.close();
    }
  });
}

prompt();
