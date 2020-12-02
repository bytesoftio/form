import { createForm } from "./createForm"
import { ObjectSchema } from "@bytesoftio/schema"
import { CreateFormFromSchema } from "./types"

export const createFormFromSchema: CreateFormFromSchema = <TValue extends object = any, TResult extends object = any>(schema: ObjectSchema<TValue>) => createForm<TValue, TResult>(schema.sanitize({})).schema(schema)
