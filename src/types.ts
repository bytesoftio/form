import { ObservableValue, ValueCallback } from "@bytesoftio/value"
import { ObjectSchema, ValidationResult, ValidationSchema } from "@bytesoftio/schema"
import { ObservableStore, StoreCallback } from "@bytesoftio/store"

export type CreateForm = <TState extends object = any, TResult extends object = any>(initialState: TState) => ObservableForm<TState, TResult>
export type CreateFormErrors = (initialState?: ValidationResult) => ObservableErrors
export type CreateFormFields = (initialState?: string[]) => ObservableFormFields
export type CreateFormState = <TState extends object>(initialState: TState | undefined, dirtyFields: ObservableFormFields, changedFields: ObservableFormFields) => ObservableFormData<TState>
export type FormValidator<TState extends object, TResult extends object> = (form: ObservableForm<TState, TResult>) => Promise<ValidationResult | undefined> | ValidationResult | undefined
export type FormCallback<TState extends object, TResult extends object> = (form: ObservableForm<TState, TResult>) => void
export type FormHandler<TState extends object, TResult extends object> = (form: ObservableForm<TState, TResult>) => Promise<any> | any
export type FormValidateOptions = { changedFieldsOnly?: boolean }
export type FormSubmitOptions = { validate?: boolean }
export type FormErrorsCallback = (newState: ValidationResult|undefined) => void

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

  listen(callback: FormErrorsCallback, notifyImmediately?: boolean): void
}

export interface ObservableFormData<TState extends object> {
  state: ObservableStore<TState>

  get(): TState
  set(newState: TState): void
  add(newState: Partial<TState>): void
  reset(initialState?: TState): void

  getAt(path: string): any
  setAt(path: string, value: any): void
  hasAt(path: string): boolean

  listen(callback: StoreCallback<TState>, notifyImmediately?: boolean): void
}

export interface ObservableForm<TState extends object = any, TResult extends object = any> {
  config: FormConfig<TState, TResult>
  data: ObservableFormData<TState>
  dirtyFields: ObservableFormFields
  changedFields: ObservableFormFields
  submitting: ObservableValue<boolean>
  submitted: ObservableValue<boolean>
  errors: ObservableErrors
  result: ObservableStore<TResult>

  reset(initialState?: TState): void
  submit(options?: FormSubmitOptions): Promise<boolean>
  validate(options?: FormValidateOptions): Promise<ValidationResult | undefined>

  configure(config: Partial<FormConfig<TState, TResult>>): this
  validator(handler: FormValidator<TState, TResult>): this
  schema(handler: ObjectSchema<Partial<TState>>): this
  handler(handler: FormHandler<TState, TResult>): this

  listen(callback: FormCallback<TState, TResult>, notifyImmediately?: boolean): void
}
