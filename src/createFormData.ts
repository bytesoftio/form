import { CreateFormState } from "./types"
import { FormData } from "./FormData"

export const createFormData: CreateFormState = (initialState, dirtyFields, changedFields) => new FormData(initialState, dirtyFields, changedFields)