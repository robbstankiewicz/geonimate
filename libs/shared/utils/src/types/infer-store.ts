import { Type } from "@angular/core"

export type InferStoreType<Store> = Store extends Type<infer T> ? T : never
