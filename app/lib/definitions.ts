// This file contains type definitions for the data.
// It describes the shape of the data, and what data type each property should accept.

export type User = {
  user_id: number;
  user_name: string;
  email: string;
  password: string; // hashed
};

export type TransactionAccount = {
  transaction_account_id: number;
  account_name: string | null;
  balance: string; // DECIMAL comes back as string with `postgres` driver
  user_id: number | null;
};

export type Transaction = {
  transaction_id: number;
  transaction_name: string | null;
  amount: string; // DECIMAL -> string
  net_amount: string | null; // DECIMAL -> string
  date: string; // TIMESTAMPTZ -> ISO string
};

export type Tag = {
  tag_id: number;
  tag_name: string;
};

export type TagAssignedToTransaction = {
  tag_assigned_to_transaction_id: number;
  transaction_id: number;
  tag_id: number;
};

export type TransactionBreakdown = {
  transaction_breakdown_id: number;
  transaction_id: number | null;
  transaction_account_id: number | null;
  spent_amount: string | null; // DECIMAL -> string
  earned_amount: string | null; // DECIMAL -> string
};

/**
 * Useful “joined/view” shapes (not tables).
 * These make UI and API code nicer.
 */

export type TransactionWithTags = Transaction & {
  tags: Tag[];
};

export type TransactionAccountWithBreakdowns = TransactionAccount & {
  breakdowns: TransactionBreakdown[];
};

export type TransactionBreakdownResolved = TransactionBreakdown & {
  transaction?: Transaction;
  transaction_account?: TransactionAccount;
};
