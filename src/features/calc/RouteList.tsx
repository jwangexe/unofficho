import { formulaById } from '@/engine/formulas';
import { isFormulaNode, nodeLabel } from '@/engine/graph';
import { formatQuantity } from '@/engine/quantity';
import type { CalcInstance, CalcTemplate } from '@/engine/template';
import { Tex } from '@/ui/Tex';
import { ARITH } from './ArithPanel';

/** The reference chain of operations, optionally marking which steps you also reached. */
export function RouteList({ template, inst, matched }: { template: CalcTemplate; inst: CalcInstance; matched?: string[] }) {
  return (
    <ol className="space-y-2">
      {template.reference.map((n, i) => {
        const value = inst.referenceValues[n.id]!;
        const hit = matched?.includes(n.id);
        let title: string;
        let latex: string | undefined;
        const label = nodeLabel(n);
        if (isFormulaNode(n)) {
          const f = formulaById.get(n.formula)!;
          title = f.name;
          latex = f.rearranged[n.solveFor];
        } else {
          title = ARITH.find((d) => d.op === n.op)?.name ?? n.op;
        }
        return (
          <li key={n.id} className="rounded-xl bg-surface-2 p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="text-muted">
                {i + 1}. {title}
              </span>
              {matched && (
                <span className={hit ? 'text-good' : 'text-muted'} aria-label={hit ? 'You reached this step' : 'You did not reach this step'}>
                  {hit ? '✓' : '·'}
                </span>
              )}
            </div>
            {latex && (
              <div className="my-1 overflow-x-auto overflow-y-hidden">
                <Tex>{latex}</Tex>
              </div>
            )}
            <div className="font-semibold">
              {label} = {formatQuantity(value, 4)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
