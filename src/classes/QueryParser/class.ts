/* eslint-disable prefer-const */
import { binaryOperators, operators } from './constants.js';
import { ParsedQuery, TokenType } from './types.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Database {
  data: { [key: string]: any }[];
}

export default class ConditionParser {
  private tokens: string[];
  private segments: ParsedQuery;
  private database: Database;

  constructor(query: string, database?: Database) {
    this.segments = this.parseSqlQuery(query);
    this.tokens = this.tokenize(this.segments.whereCondition);
    this.database = database;
  }

  public parse(): any[] {
    const result = [];
    let i = 0;
    while (i < this.database.data.length - 1) {
      const row = this.database.data[i];
      if (this.segments.limit && result.length >= this.segments.limit) {
        i++;
        continue;
      }
      if (!this.segments.whereCondition) {
        const filteredObj = Object.keys(row).reduce((acc, key) => {
          if (this.segments.columns.includes('*')) {
            acc = row;
          }
          if (this.segments.columns.includes(key)) {
            acc[key] = row[key];
          }
          return acc;
        }, {});
        result.push(filteredObj);
        i++;
        continue;
      }
      const passesConditions = this.evaluateCondition(row);
      if (passesConditions) {
        const filteredObj = Object.keys(row).reduce((acc, key) => {
          if (this.segments.columns.includes('*')) {
            acc = row;
          }
          if (this.segments.columns.includes(key)) {
            acc[key] = row[key];
          }
          return acc;
        }, {});
        result.push(filteredObj);
        i++;
        continue;
      }
      i++;
      continue;
    }

    return result;
  }

  public parseSqlQuery(sqlQuery: string): ParsedQuery {
    if (!sqlQuery.includes('SELECT') || !sqlQuery.includes('FROM')) {
      throw new Error('Invalid SQL query, missing SELECT or FROM keywords');
    }

    const columns = sqlQuery
      .split('SELECT')[1]
      .split('FROM')[0]
      .replaceAll('"', '')
      .trim()
      .split(',')
      .map((column) => column.trim());

    const tableName = sqlQuery.split('FROM')[1].split('WHERE')[0].trim();

    const conditionsExist = sqlQuery.includes('WHERE');

    const conditions = conditionsExist
      ? sqlQuery.split('WHERE')[1].split('LIMIT')[0].replace(';', '')
      : null;

    const limit = conditionsExist
      ? sqlQuery.includes('LIMIT') && sqlQuery.split('LIMIT')[1].trim()
      : null;

    if (!columns || !tableName) {
      throw new Error('Invalid SQL query');
    }

    const parsedQuery: ParsedQuery = {
      table: tableName,
      columns,
      whereCondition: conditions,
      limit: limit ? parseInt(limit) : null,
    };

    return parsedQuery;
  }

  /**
   * Tokenizes the given conditions string.
   *
   * @param conditions - The conditions string to tokenize.
   * @returns An array of tokens representing the conditions.
   */
  private tokenize(conditions: string): string[] {
    if (!conditions) {
      return [];
    }
    const normalizedConditions = conditions
      .replace(/\s+/g, ' ')
      .replaceAll('"', '')
      .trim(); // Normalize spaces
    return (
      normalizedConditions.match(
        /(?:\b(?:AND|OR)\b|\w+|[!=<>]+|['"\d]+|\S)/g,
      ) || []
    );
  }

  private parseTokenType(token: string): TokenType {
    if (token === '(' || token === ')') {
      return TokenType.Parenthesis;
    }
    if (binaryOperators.includes(token)) {
      return TokenType.Binary;
    }
    if (operators.includes(token)) {
      return TokenType.Operator;
    }
    return TokenType.Value;
  }

  /**
   * Evaluates a comparison between two values.
   * @param left The left operand of the comparison.
   * @param operator The comparison operator.
   * @param right The right operand of the comparison.
   * @returns True if the comparison is true, false otherwise.
   * @throws Error if the operator is not supported.
   */
  private evaluateComparison(left: any, operator: string, right: any): boolean {
    switch (operator) {
      case '=':
        return left === right;
      case '!=':
        return left !== right;
      case '>':
        return left > right;
      case '<':
        return left < right;
      case '>=':
        return left >= right;
      case '<=':
        return left <= right;
      case 'OR':
        return left || right;
      case 'AND':
        return left && right;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  /**
   * Evaluates a subcondition in the given tokens array starting from the specified index.
   *
   * @param tokens - The array of tokens representing the condition.
   * @param index - The starting index of the subcondition.
   * @param row - The row object containing the values for the condition evaluation.
   * @param prioritizeBinary - Whether to prioritize resolving binary over continuing expression.
   * @returns An object containing the result of the subcondition evaluation, the new index, and the row object.
   */
  private evaluateSubcondition(
    tokens: string[],
    index: number,
    row,
  ): { result: boolean; newIndex: number; row: { [key: string]: any } } {
    // Stacks to hold the values
    let valueStack: any[] = [];

    // Stack to hold the operators
    let operatorStack: string[] = [];

    // stack to hold the result of the subcondition
    let resultStack: boolean[] = [];

    // Start from the given index (because we might be in a subcondition already)
    let i = index;

    // Iterate through the tokens
    while (i < tokens.length) {
      const token = tokens[i];
      const tokenType = this.parseTokenType(token);

      if (tokenType === TokenType.Parenthesis) {
        const { killInstance, result, index } = this.handleParenthesis({
          tokens,
          token,
          index: i,
          row,
        });
        if (killInstance) {
          return { result: resultStack.pop(), newIndex: index, row };
        }
        i = index;
        result !== undefined && resultStack.push(result);
        continue;
      }

      if (tokenType === TokenType.Binary) {
        const { newIndex, result: newResult } = this.handleBinaryOperator({
          tokens,
          token,
          index: i,
          resultStack,
          row,
        });
        newIndex && (i = newIndex);
        newResult !== undefined && resultStack.push(newResult);
        continue;
      }

      if (tokenType === TokenType.Operator) {
        const { operator } = this.handleOperator({
          token,
          operatorStack,
          valueStack,
        });
        operator && operatorStack.push(operator);
      }

      if (tokenType === TokenType.Value) {
        const { newValue, newResult, newOperatorStack } = this.handleValue({
          token,
          valueStack,
          operatorStack,
          row,
        });
        newValue && valueStack.push(newValue);
        newResult !== undefined && resultStack.push(newResult);
        newOperatorStack && (operatorStack = newOperatorStack);
      }
      i++;
    }
    return { result: resultStack.pop(), newIndex: i + 1, row };
  }

  private handleParenthesis({
    tokens,
    token,
    index,
    row,
  }: {
    tokens: string[];
    token: string;
    index: number;
    row: { [key: string]: any };
  }): { index: number; killInstance: boolean; result?: boolean } {
    if (token === '(') {
      const { result, newIndex } = this.evaluateSubcondition(
        tokens,
        index + 1,
        row,
      );
      return { killInstance: false, result, index: newIndex };
    }
    return { killInstance: true, index: index + 1 };
  }

  private handleBinaryOperator({
    tokens,
    token,
    index,
    row,
    resultStack,
  }: {
    tokens: string[];
    token: string;
    index: number;
    resultStack: boolean[];
    row: { [key: string]: any };
  }): { newIndex?: number; result?: boolean } {
    if (!resultStack.length) {
      throw new Error(`Error near "${token}"`);
    }
    if (binaryOperators.includes(token)) {
      const { result: subResult, newIndex } = this.evaluateSubcondition(
        tokens,
        index + 1,
        row,
      );

      const result = this.evaluateComparison(
        resultStack.pop(),
        token,
        subResult,
      );
      return { newIndex, result };
    }
    return { newIndex: index };
  }

  private handleOperator({
    token,
    operatorStack,
    valueStack,
  }: {
    token: string;
    operatorStack: string[];
    valueStack: any[];
  }): { operator: string } {
    if (!valueStack.length || operatorStack.length) {
      throw new Error(`Error near "${token}"`);
    }
    return { operator: token };
  }

  private handleValue({
    token,
    valueStack,
    operatorStack,
    row,
  }: {
    token: string;
    valueStack: any[];
    operatorStack: string[];
    row: { [key: string]: any };
  }): {
    newValue?: string;
    newResult?: boolean;
    newOperatorStack?: string[];
    newValueStack?: any[];
  } {
    // If there is 2 values in a row, we need to throw an error
    if (valueStack[0] && !operatorStack.length) {
      throw new Error(`Error near "${token}"`);
      // If there is no value and no operator, we need to push the value
    } else if (!valueStack[0] && !operatorStack[0]) {
      const value = token in row ? row[token] : token;
      return { newValue: value };
      // If there is a value and an operator, we need to evaluate the comparison
    } else if (valueStack[0] && operatorStack[0]) {
      const result = this.evaluateComparison(
        valueStack.pop(),
        operatorStack.pop(),
        token in row ? row[token] : token,
      );
      return {
        newResult: result,
        newValueStack: valueStack,
        newOperatorStack: operatorStack,
      };
    }
    throw new Error(`Something unexpected happened near "${token}"`);
  }

  private evaluateCondition(row: { [key: string]: any }): boolean {
    const { result } = this.evaluateSubcondition(this.tokens, 0, row);
    return result;
  }
}
