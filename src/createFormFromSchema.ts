import { CreateFormFromSchema } from "./types"
import { createForm } from "./createForm"

export const createFormFromSchema: CreateFormFromSchema = <TValue extends object, TResult extends object>(schema) => {
  return createForm<TValue, TResult>(schema.sanitize({})).schema(schema)
}
