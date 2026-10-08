import mongoose, { Schema, Types } from "mongoose";

/**
 * Per-company sequence counters used to generate document numbers
 * (journal entries, invoices, bills, payments).
 *
 * Numbers are allocated with an atomic `$inc`, so concurrent requests can
 * never receive the same number. Allocation deliberately runs outside the
 * caller's transaction: incrementing a shared counter document inside many
 * concurrent transactions causes write conflicts. The trade-off is that an
 * aborted transaction leaves a gap in the sequence.
 */
interface ICounter {
  companyId: Types.ObjectId;
  key: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>(
  {
    companyId: { type: Schema.Types.ObjectId, required: true },
    key: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { collection: "counters", versionKey: false },
);

CounterSchema.index({ companyId: 1, key: 1 }, { unique: true });

export const Counter =
  (mongoose.models.Counter as mongoose.Model<ICounter>) ||
  mongoose.model<ICounter>("Counter", CounterSchema);

const isDuplicateKeyError = (error: unknown) =>
  (error as { code?: number })?.code === 11000;

/**
 * Atomically allocate the next number in a per-company sequence.
 *
 * @param initial  Called only the first time a sequence is used, to seed it
 *                 from the highest number already in use (so introducing the
 *                 counter never re-issues an existing document number).
 */
export async function nextSequence(
  companyId: Types.ObjectId | string,
  key: string,
  options: {
    initial?: () => Promise<number>;
  } = {},
): Promise<number> {
  const companyObjectId = new Types.ObjectId(String(companyId));

  const increment = () =>
    Counter.findOneAndUpdate(
      { companyId: companyObjectId, key },
      { $inc: { seq: 1 } },
      { new: true },
    ).lean();

  let counter = await increment();
  if (counter) return counter.seq;

  // First use of this sequence: seed it from existing data.
  const seed = options.initial ? await options.initial() : 0;
  try {
    await Counter.updateOne(
      { companyId: companyObjectId, key },
      { $setOnInsert: { seq: seed } },
      { upsert: true },
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }

  counter = await increment();
  if (!counter) {
    throw new Error(`Failed to allocate sequence number for "${key}"`);
  }
  return counter.seq;
}

/**
 * Generate the next document number of the form `<prefix><zero-padded seq>`,
 * e.g. `INV-2026-0042`.
 *
 * @param model  Model holding existing numbers (used once, to seed the counter).
 * @param field  Field on `model` that stores the number.
 */
export async function nextDocumentNumber(params: {
  model: mongoose.Model<any>;
  field: string;
  companyId: Types.ObjectId | string;
  prefix: string;
  pad?: number;
  extraFilter?: Record<string, unknown>;
}): Promise<string> {
  const { model, field, companyId, prefix, pad = 4 } = params;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const seq = await nextSequence(companyId, prefix, {
    initial: async () => {
      // Numeric (not lexicographic) max of existing suffixes.
      const docs = await model
        .find({
          companyId: new Types.ObjectId(String(companyId)),
          [field]: new RegExp(`^${escapedPrefix}\\d+$`),
          ...(params.extraFilter ?? {}),
        })
        .select(field)
        .lean();
      return docs.reduce((max: number, doc: any) => {
        const n = parseInt(String(doc[field]).slice(prefix.length), 10);
        return Number.isFinite(n) && n > max ? n : max;
      }, 0);
    },
  });

  return `${prefix}${seq.toString().padStart(pad, "0")}`;
}
