import { ObservableValue, ValueCallback } from "@bytesoftio/value"
import { ObjectSchema, ValidationResult, ValidationSchema } from "@bytesoftio/schema"
import { ObservableStore, StoreCallback } from "@bytesoftio/store"

export type CreateForm = <TValue extends object = any, TResult extends object = any>(initialValue: TValue) => ObservableForm<TValue, TResult>
export type CreateFormErrors = (initialValue?: ValidationResult) => ObservableErrors
export type CreateFormFields = (initialValue?: string[]) => ObservableFormFields
export type CreateFormValues = <TValue extends object>(initialValue: TValue | undefined, dirtyFields: ObservableFormFields, changedFields: ObservableFormFields) => ObservableFormValues<TValue>
export type FormValidator<TValue extends object, TResult extends object> = (form: ObservableForm<TValue, TResult>) => Promise<ValidationResult | undefined> | ValidationResult | undefined
export type FormCallback<TValue extends object, TResult extends object> = (form: ObservableForm<TValue, TResult>) => void
export type FormHandler<TValue extends object, TResult extends object> = (form: ObservableForm<TValue, TResult>) => Promise<any> | any
export type FormValidateOptions = { changedFieldsOnly?: boolean }
export type FormSubmitOptions = { validate?: boolean }
export type FormErrorsCallback = (newErrors: ValidationResult|undefined) => void

export type FormConfig<S extends object, R extends object> = {
  validators: FormValidator<S, R>[]
  schemas: ValidationSchema[]
  handlers: FormHandler<S, R>[]
  validateOnSubmit: boolean
  validateChangedFieldsOnly: boolean
  validateOnChange: boolean
}

export interface ObservableFormFields {
  value: ObservableValue<string[]>

  get(): string[]
  has(newFields: string | string[]): boolean
  set(newFields: string[]): void
  add(newFields: string | string[]): void
  remove(fields: string | string[]): void
  clear(): void

  listen(callback?: ValueCallback<string[]>, notifyImmediately?: boolean): void
}

export interface ObservableErrors {
  value: ObservableStore<ValidationResult>

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

export interface ObservableFormValues<TValue extends object> {
  value: ObservableStore<TValue>

  get(): TValue
  set(newValues: TValue): void
  add(newValues: Partial<TValue>): void
  reset(initialValue?: TValue): void

  getAt(path: string): any
  setAt(path: string, value: any): void
  hasAt(path: string): boolean

  listen(callback: StoreCallback<TValue>, notifyImmediately?: boolean): void
}

export interface ObservableForm<TValue extends object = any, TResult extends object = any> {
  config: FormConfig<TValue, TResult>
  values: ObservableFormValues<TValue>
  dirtyFields: ObservableFormFields
  changedFields: ObservableFormFields
  submitting: ObservableValue<boolean>
  submitted: ObservableValue<boolean>
  errors: ObservableErrors
  result: ObservableStore<TResult>

  reset(initialValues?: TValue): void
  submit(options?: FormSubmitOptions): Promise<boolean>
  validate(options?: FormValidateOptions): Promise<ValidationResult | undefined>

  configure(config: Partial<FormConfig<TValue, TResult>>): this
  validator(handler: FormValidator<TValue, TResult>): this
  schema(handler: ObjectSchema<Partial<TValue>>): this
  handler(handler: FormHandler<TValue, TResult>): this

  listen(callback: FormCallback<TValue, TResult>, notifyImmediately?: boolean): void
}
