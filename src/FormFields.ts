import { difference, isArray, uniq } from "lodash"
import { ObservableFormFields } from "./types"
import { createValue, ObservableValue, ValueCallback } from "@bytesoftio/value"

export class FormFields implements ObservableFormFields {
  state: ObservableValue<string[]>

  constructor(initialState?: string[]) {
    this.state = createValue<string[]>([])

    if (initialState) {
      this.set(initialState)
    }
  }

  get(): string[] {
    return this.state.get()
  }

  has(fields: string | string[]): boolean {
    if ( ! isArray(fields)) {
      fields = [fields]
    }

    return difference(fields, this.state.get()).length === 0
  }

  set(fields: string[]) {
    this.state.set(uniq(fields))
  }

  add(fields: string | string[]) {
    if ( ! isArray(fields)) {
      fields = [fields]
    }

    this.set([...this.state.get(), ...fields])
  }

  remove(fields: string | string[]) {
    if ( ! isArray(fields)) {
      fields = [fields]
    }

    this.state.set(difference(this.state.get(), fields))
  }

  clear() {
    this.state.reset()
  }

  listen(callback: ValueCallback<string[]>, notifyImmediately?: boolean): void {
    this.state.listen(callback, notifyImmediately)
  }
}