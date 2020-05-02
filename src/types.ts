import { ObservableValue, ValueCallback } from "@bytesoftio/value"
import { ObjectSchema, ValidationResult, ValidationSchema } from "@bytesoftio/schema"
import { ObservableStore, StoreCallback } from "@bytesoftio/store"

export type CreateForm = <S extends object = any, R extends object = any>(initialState: S) => ObservableForm<S, R>
export type CreateFormErrors = (initialState?: ValidationResult) => ObservableErrors
export type CreateFormFields = (initialState?: string[]) => ObservableFormFields
export type CreateFormState = <S extends object>(initialState: S | undefined, dirtyFields: ObservableFormFields, changedFields: ObservableFormFields) => ObservableFormData<S>
export type FormValidator<S extends object, R extends object> = (form: ObservableForm<S, R>) => Promise<ValidationResult | undefined> | ValidationResult | undefined
export type FormCallback<S extends object, R extends object> = (form: ObservableForm<S, R>) => void
export type FormHandler<S extends object, R extends object> = (form: ObservableForm<S, R>) => Promise<any> | any
export type FormValidateOptions = { changedFieldsOnly?: boolean }
export type FormSubmitOptions = { validate?: boolean }
export type FormErrorsCallback<S extends object> = (newState: S|undefined) => void

export type FormConfig<S extends object, R extends object> = {
  validators: FormValidator<S, R>[]
  schemas: ValidationSchema[]
  handlers: FormHandler<S, R>[]
  validateOnSubmit: boolean
  validateChangedFieldsOnly: boolean
  validateOnChange: boolean
}

export interface ObservableFormFields {
  state: ObservableValue<string[]>

  get(): string[]
  has(fields: string | string[]): boolean
  set(fields: string[]): void
  add(fields: string | string[]): void
  remove(fields: string | string[]): void
  clear(): void

  listen(callback?: ValueCallback<string[]>, notifyImmediately?: boolean): void
}

export interface ObservableErrors {
  state: ObservableStore<ValidationResult>

  get(): ValidationResult | undefined
  set(newErrors: ValidationResult): void
  add(newErrors: Partial<ValidationResult>): void
  has(): boolean
  clear(): void

  getAt(path: string): string[] | undefined
  setAt(path: string, newErrors: string[]): void
  addAt(path: string, newErrors: string | string[]): void
  hasAt(path: string | string[]): boolean
  clearAt(path: string | string[]): void

  listen(callback: FormErrorsCallback<ValidationResult>, notifyImmediately?: boolean): void
}

export interface ObservableFormData<S extends object> {
  state: ObservableStore<S>

  get(): S
  set(newState: S): void
  add(newState: Partial<S>): void
  reset(initialState?: S): void

  getAt(path: string): any
  setAt(path: string, value: any): void
  hasAt(path: string): boolean

  listen(callback: StoreCallback<S>, notifyImmediately?: boolean): void
}

export interface ObservableForm<S extends object = any, R extends object = any> {
  config: FormConfig<S, R>
  data: ObservableFormData<S>
  dirtyFields: ObservableFormFields
  changedFields: ObservableFormFields
  submitting: ObservableValue<boolean>
  submitted: ObservableValue<boolean>
  errors: ObservableErrors
  result: ObservableStore<R>

  reset(initialState?: S): void
  submit(options?: FormSubmitOptions): Promise<boolean>
  validate(options?: FormValidateOptions): Promise<ValidationResult | undefined>

  configure(config: Partial<FormConfig<S, R>>): this
  validator(handler: FormValidator<S, R>): this
  schema(handler: ObjectSchema<Partial<S>>): this
  handler(handler: FormHandler<S, R>): this

  listen(callback: FormCallback<S, R>, notifyImmediately?: boolean): void
}