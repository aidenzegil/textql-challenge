export enum TokenType {
  Parenthesis = 'Parenthesis',
  Binary = 'Binary',
  Operator = 'Operator',
  Value = 'Value',
}

export interface ParsedQuery {
  table: string;
  columns: string[];
  whereCondition?: string;
  limit?: number;
}
