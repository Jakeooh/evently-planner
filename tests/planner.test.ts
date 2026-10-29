import { describe, expect, it } from 'vitest';
import { createAllocations, normalizeAllocations, rebalanceBudget, sanitizeText, validateEvent, createFallbackPlan } from '../src/lib/planner';
import { planSchema, type EventInput } from '../src/types';

const input: EventInput = { type:'Wedding', date:'2027-06-12', guests:80, budget:12000, city:'Portland', vibe:'garden', mustHaves:'' };
describe('planning utilities',()=>{
  it('allocates exactly the budget and rebalances edits',()=>{const initial=createAllocations(12001);expect(initial.reduce((sum,row)=>sum+row.amount,0)).toBe(12001);const changed=rebalanceBudget(initial,'venue',5000,12001);expect(changed.reduce((sum,row)=>sum+row.amount,0)).toBe(12001);expect(changed[0]?.amount).toBe(5000);});
  it('normalizes model suggestions to the exact total',()=>{const suggestion=createAllocations(100).map(item=>({...item,amount:0}));suggestion[0]!.amount=75;suggestion[1]!.amount=25;const result=normalizeAllocations(suggestion,12000);expect(result.reduce((sum,item)=>sum+item.amount,0)).toBe(12000);expect(result[0]!.amount).toBe(9000);});
  it('flags past dates and invalid guest counts',()=>{expect(validateEvent({...input,date:'2000-01-01'})).toMatch(/date/i);expect(validateEvent({...input,guests:5001})).toMatch(/guest/i);});
  it('sanitizes control chars, tags, trims and limits length',()=>{expect(sanitizeText('  hello\u0000 there  ')).toBe('hello there');expect(sanitizeText('<script>alert(1)</script>')).toBe('alert(1)');expect(sanitizeText('x'.repeat(150),20)).toHaveLength(20);expect(sanitizeText('')).toBe('');});
  it('provides a valid safe fallback schema',()=>{expect(planSchema.safeParse(createFallbackPlan(input)).success).toBe(true);expect(planSchema.safeParse({budget:[]}).success).toBe(false);});
});
