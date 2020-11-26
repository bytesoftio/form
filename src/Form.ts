import {
  FormCallback,
  FormConfig,
  FormHandler,
  FormSubmitOptions, FormValidateOptions,
  FormValidator,
  ObservableForm,
  ObservableErrors,
  ObservableFormFields,
  ObservableFormValues,
} from "./types"
import { createValue, ObservableValue } from "@bytesoftio/value"
import { createFormValues } from "./createFormValues"
import { createFormFields } from "./createFormFields"
import { createFormErrors } from "./createFormErrors"
import { keys, merge } from "lodash"
import { createValidationResult, ValidationResult, ValidationSchema } from "@bytesoftio/schema"
import { createStore, ObservableStore } from "@bytesoftio/store"

export class Form<TValues extends object = any, TResult extends object = any> implements ObservableForm<TValues, TResult> {
  config: FormConfig<TValues, TResult>
  values: ObservableFormValues<TValues>
  dirtyFields: ObservableFormFields
  changedFields: ObservableFormFields
  submitting: ObservableValue<boolean>
  submitted: ObservableValue<boolean>
  errors: ObservableErrors
  result: ObservableStore<TResult>

  constructor(initialValues: TValues) {
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
    this.values = createFormValues(initialValues, this.dirtyFields, this.changedFields)
    this.submitting = createValue<boolean>(false)
    this.submitted = createValue<boolean>(false)
    this.errors = createFormErrors()
    this.result = createStore<TResult>({} as TResult)

    this.setupValidateOnChange()
  }

  reset(initialValues?: TValues): void {
    this.values.reset(initialValues)
    this.submitting.reset()
    this.submitted.reset()
    this.dirtyFields.clear()
    this.changedFields.clear()
    this.errors.clear()
    this.result.reset()
  }

  listen(callback: FormCallback<TValues, TResult>, notifyImmediately?: boolean): void {
    const formCallback = () => callback(this)

    this.values.listen(formCallback, notifyImmediately)
    this.submitting.listen(formCallback, notifyImmediately)
    this.submitted.listen(formCallback, notifyImmediately)
    this.dirtyFields.listen(formCallback, notifyImmediately)
    this.changedFields.listen(formCallback, notifyImmediately)
    this.errors.listen(formCallback, notifyImmediately)
    this.result.listen(formCallback, notifyImmediately)
  }

  configure(config: Partial<FormConfig<TValues, TResult>>): this {
    this.config = { ...this.config, ...config }

    return this
  }

  handler(handler: FormHandler<TValues, TResult>): this {
    this.config.handlers.push(handler)

    return this
  }

  validator(handler: FormValidator<TValues, TResult>): this {
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
        return createValidationResult(await schema.validateAsync(this.values.get()))
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
    this.values.listen(() => {
      if (this.config.validateOnChange) {
        try {
          this.validate({ changedFieldsOnly: true })
        } catch (error) {
        }
      }
    }, false)
  }
}
