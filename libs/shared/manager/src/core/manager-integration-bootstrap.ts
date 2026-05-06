import { inject, provideEnvironmentInitializer } from '@angular/core';
import { ManagerService } from './services/manager.service';
import { ConfigToMapEffects } from './effects/config-to-map.effects';
import { ConfigToTimelineEffects } from './effects/config-to-timeline.effects';
import { MapToConfigTimelineEffects } from './effects/map-to-config-timeline.effects';
import { SettingsToTimelineMapEffects } from './effects/settings-to-timeline-map.effects';
import { TimelineKeyframeDragEffects } from './effects/timeline-keyframe-drag.effects';
import { MapPlayheadPropertyEffects } from './effects/map-playhead-property.effects';

export function provideManagerIntegrationEffects() {
    return provideEnvironmentInitializer(() => {
        inject(ManagerService);
        inject(ConfigToMapEffects);
        inject(ConfigToTimelineEffects);
        inject(MapToConfigTimelineEffects);
        inject(SettingsToTimelineMapEffects);
        inject(TimelineKeyframeDragEffects);
        inject(MapPlayheadPropertyEffects);
    });
}
