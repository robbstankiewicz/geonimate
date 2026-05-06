import { KeyframeId, TimeMs, LayerId } from "@geonimate/shared-utils";

export interface KeyframeState {
    id: KeyframeId;
    timeMs: TimeMs;
    trackId: LayerId;
}
