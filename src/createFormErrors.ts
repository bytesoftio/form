import { CreateFormErrors } from "./types"
import { FormErrors } from "./FormErrors"
import { ValidationResult } from "@bytesoftio/schema"

export const createFormErrors: CreateFormErrors = (initialValue?: ValidationResult) => new FormErrors(initialValue)
