import { GenericId } from "../types/ids";

export function generateId<T extends GenericId>(): T {
    return crypto.randomUUID() as T;
}
