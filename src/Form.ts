import {
  FormCallback,
  FormConfig,
  FormHandler,
  FormSubmitOptions, FormValidateOptions,
  FormValidator,
  ObservableForm,
  ObservableErrors,
  ObservableFormFields,
  ObservableFormData,
} from "./types"
import { createValue, ObservableValue } from "@bytesoftio/value"
import { createFormData } from "./createFormData"
import { createFormFields } from "./createFormFields"
import { createFormErrors } from "./createFormErrors"
import { keys, merge } from "lodash"
import { createValidationResult, ValidationResult, ValidationSchema } from "@bytesoftio/schema"
import { createStore, ObservableStore } from "@bytesoftio/store"

export class Form<TState extends object = any, TResult extends object = any> implements ObservableForm<TState, TResult> {
  config: FormConfig<TState, TResult>
  data: ObservableFormData<TState>
  dirtyFields: ObservableFormFields
  changedFields: ObservableFormFields
  submitting: ObservableValue<boolean>
  submitted: ObservableValue<boolean>
  errors: ObservableErrors
  result: ObservableStore<TResult>

  constructor(initialState: TState) {
    this.config = {
      handlers: [],
      validators: [],
      schemas: [],
      validateChangedFieldsOnly: false,
      validateOnChange: true,
      validateOnSubmit: true,
    }

    this.dirtyFields = createFormFields()
    this.changedFields = createFormFields()
    this.data = createFormData(initialState, this.dirtyFields, this.changedFields)
    this.submitting = createValue<boolean>(false)
    this.submitted = createValue<boolean>(false)
    this.errors = createFormErrors()
    this.result = createStore<TResult>({} as TResult)

    this.setupValidateOnChange()
  }

  reset(initialState?: TState): void {
    this.data.reset(initialState)
    this.submitting.reset()
    this.submitted.reset()
    this.dirtyFields.clear()
    this.changedFields.clear()
    this.errors.clear()
    this.result.reset()
  }

  listen(callback: FormCallback<TState, TResult>, notifyImmediately?: boolean): void {
    const formCallback = () => callback(this)

    this.data.listen(formCallback, notifyImmediately)
    this.submitting.listen(formCallback, notifyImmediately)
    this.submitted.listen(formCallback, notifyImmediately)
    this.dirtyFields.listen(formCallback, notifyImmediately)
    this.changedFields.listen(formCallback, notifyImmediately)
    this.errors.listen(formCallback, notifyImmediately)
    this.result.listen(formCallback, notifyImmediately)
  }

  configure(config: Partial<FormConfig<TState, TResult>>): this {
    this.config = { ...this.config, ...config }

    return this
  }

  handler(handler: FormHandler<TState, TResult>): this {
    this.config.handlers.push(handler)

    return this
  }

  validator(handler: FormValidator<TState, TResult>): this {
    this.config.validators.push(handler)

    return this
  }

  schema(handler: ValidationSchema): this {
    this.config.schemas.push(handler)

    return this
  }

  async submit(options?: FormSubmitOptions): Promise<boolean> {
    if (this.submitting.get() === true) {
      return false
    }

    const validate = options?.validate === true || (this.config.validateOnSubmit && options?.validate !== false)

    this.result.reset()
    this.errors.clear()

    this.submitting.set(true)

    if (validate) {
      const errors = await this.validate()

      if (errors) {
        this.submitting.set(false)

        return false
      }
    }

    for (const handler of this.config.handlers) {
      const index = this.config.handlers.indexOf(handler)

      try {
        await handler(this)
      } catch (error) {
        this.submitting.set(false)

        console.error(`There was an error in form submit handler #${index}:`, error)
        throw error
      }
    }

    this.submitting.set(false)
    this.submitted.set(true)

    return true
  }

  async validate(options?: FormValidateOptions): Promise<ValidationResult | undefined> {
    const changedFieldsOnly = options?.changedFieldsOnly === true || (this.config.validateChangedFieldsOnly && options?.changedFieldsOnly !== false)

    const validatorErrors = await Promise.all(this.config.validators.map(async (validator, index) => {
      try {
        return await validator(this)
      } catch (error) {
        console.error(`There was an error in form validator #${index}:`, error)
        throw error
      }
    }))

    const schemaErrors = await Promise.all(this.config.schemas.map(async (schema, index) => {
      try {
        return createValidationResult(await schema.validate(this.data.get()))
      } catch (error) {
        console.error(`There was an error in form schema #${index}:`, error)
        throw error
      }
    }))

    const allErrors = [...validatorErrors, ...schemaErrors]

    const errors = allErrors.reduce((errors, errorSet) => {
      return merge({}, errors, errorSet)
    }, {})!

    if (changedFieldsOnly) {
      keys(errors).forEach(key => {
        if ( ! this.changedFields.get().includes(key)) {
          delete errors[key]
        }
      })
    }

    this.errors.set(errors)

    return this.errors.get()
  }

  protected setupValidateOnChange() {
    this.data.listen(() => {
      if (this.config.validateOnChange) {
        try {
          this.validate({ changedFieldsOnly: true })
        } catch (error) {
        }
      }
    }, false)
  }
}
