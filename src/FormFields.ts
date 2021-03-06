import { difference, isArray, uniq } from "lodash"
import { ObservableFormFields } from "./types"
import { createValue, ObservableValue, ValueCallback } from "@bytesoftio/value"

export class FormFields implements ObservableFormFields {
  value: ObservableValue<string[]>

  constructor(initialValue?: string[]) {
    this.value = createValue<string[]>([])

    if (initialValue) {
      this.set(initialValue)
    }
  }

  get(): string[] {
    return this.value.get()
  }

  has(fields: string | string[]): boolean {
    if ( ! isArray(fields)) {
      fields = [fields]
    }

    return difference(fields, this.value.get()).length === 0
  }

  set(fields: string[]) {
    this.value.set(uniq(fields))
  }

  add(fields: string | string[]) {
    if ( ! isArray(fields)) {
      fields = [fields]
    }

    this.set([...this.value.get(), ...fields])
  }

  remove(fields: string | string[]) {
    if ( ! isArray(fields)) {
      fields = [fields]
    }

    this.value.set(difference(this.value.get(), fields))
  }

  clear() {
    this.value.reset()
  }

  listen(callback: ValueCallback<string[]>, notifyImmediately?: boolean): void {
    this.value.listen(callback, notifyImmediately)
  }
}
