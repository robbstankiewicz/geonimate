import { Branded } from "./brand";

export type GenericId = string;
export type KeyframeId = Branded<GenericId, "KeyframeId">;
export type LayerId = Branded<GenericId, "LayerId">
