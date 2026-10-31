/**
 * Operation graphs: the reference solution of a question is a list of steps (formula solves
 * and arithmetic operations) whose inputs refer to givens, constants, literals or earlier steps.
 *
 * Refs:  'p.x' template parameter · 'g.x' given chip · 'n.id' an earlier node ·
 *        'c.R' physical constant · '#2' a dimensionless literal.
 */
import { CONSTANTS } from './constants';
import { formulaById } from './formulas';
import { solveFormula } from './formula';
import * as ops from './ops';
import { qty, type Quantity } from './quantity';
import { fail, ok, type Result } from './result';
import { getUnit } from './units';

export type Ref = string;

export type ArithOp = 'add' | 'sub' | 'mul' | 'div' | 'ln' | 'log10' | 'exp' | 'pow10' | 'pow' | 'scale' | 'sum' | 'convert';

/** `label` names the step's result for display (defaults to the solved variable's label, or the id). */
type NodeBase = { id: string; label?: string };

export type GraphNode = NodeBase &
  (
    | { formula: string; solveFor: string; inputs: Record<string, Ref> }
    | { op: 'add' | 'sub' | 'mul' | 'div'; inputs: [Ref, Ref] }
    | { op: 'ln' | 'log10' | 'exp' | 'pow10'; inputs: [Ref] }
    | { op: 'pow'; inputs: [Ref]; exponent: number }
    | { op: 'scale'; inputs: [Ref]; coef: number }
    | { op: 'sum'; inputs: Ref[]; coefs: number[] }
    | { op: 'convert'; inputs: [Ref]; unit: string }
  );

export type OpNode = Exclude<GraphNode, { formula: string }>;

export const isFormulaNode = (n: GraphNode): n is Extract<GraphNode, { formula: string }> => 'formula' in n;

/** Display label of a node's result. */
export function nodeLabel(n: GraphNode): string {
  if (n.label) return n.label;
  if (isFormulaNode(n)) return formulaById.get(n.formula)?.vars.find((v) => v.sym === n.solveFor)?.label ?? n.id;
  return n.id;
}

export function constantQuantity(id: string): Quantity {
  const c = CONSTANTS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown constant ${id}`);
  return { value: c.value, dim: getUnit(c.unit).dim, unit: c.unit };
}

/** Parameters of an arithmetic step (beyond its input quantities). */
export interface OpParams {
  exponent?: number;
  coef?: number;
  coefs?: number[];
  unit?: string;
}

/** Run one arithmetic operation. Shared by the reference executor and the chip UI. */
export function runOp(op: ArithOp, inputs: Quantity[], p: OpParams = {}): Result<Quantity> {
  const [a, b] = inputs;
  if (!a) return fail('missing', 'Choose an input');
  switch (op) {
    case 'add':
    case 'sub':
    case 'mul':
    case 'div':
      if (!b) return fail('missing', 'Choose a second input');
      return ops[op](a, b);
    case 'ln':
    case 'log10':
    case 'exp':
    case 'pow10':
      return ops[op](a);
    case 'pow':
      return ops.pow(a, p.exponent ?? 2);
    case 'scale':
      return ops.scale(a, p.coef ?? 1);
    case 'sum':
      return ops.weightedSum(inputs.map((q, i) => ({ coef: p.coefs?.[i] ?? 1, q })));
    case 'convert':
      return ops.convert(a, p.unit ?? a.unit);
  }
}

function resolve(ref: Ref, env: Record<Ref, Quantity>): Quantity | undefined {
  if (ref.startsWith('#')) return qty(Number(ref.slice(1)), '1');
  if (ref.startsWith('c.')) return constantQuantity(ref.slice(2));
  return env[ref];
}

/** Evaluate nodes in order; returns the environment extended with 'n.<id>' entries. */
export function evaluateGraph(nodes: readonly GraphNode[], env: Record<Ref, Quantity>): Result<Record<Ref, Quantity>> {
  const out = { ...env };
  for (const node of nodes) {
    const get = (r: Ref) => resolve(r, out);
    let res: Result<Quantity>;
    if (isFormulaNode(node)) {
      const f = formulaById.get(node.formula);
      if (!f) return fail('missing', `Unknown formula ${node.formula}`);
      const assigned: Record<string, Quantity> = {};
      for (const [sym, ref] of Object.entries(node.inputs)) {
        const q = get(ref);
        if (!q) return fail('missing', `Node ${node.id}: unresolved ${ref}`);
        assigned[sym] = q;
      }
      const s = solveFormula(f, node.solveFor, assigned);
      res = s.ok ? ok(s.value.quantity) : s;
    } else {
      const inputs: Quantity[] = [];
      for (const ref of node.inputs) {
        const q = get(ref);
        if (!q) return fail('missing', `Node ${node.id}: unresolved ${ref}`);
        inputs.push(q);
      }
      res = runOp(node.op, inputs, node as OpParams);
    }
    if (!res.ok) return fail(res.error.code, `Step ${node.id}: ${res.error.message}`);
    out[`n.${node.id}`] = res.value;
  }
  return ok(out);
}
