import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ManagerService } from './services/manager.service';
import { StatePersistenceService } from './services/state-persistence.service';
import { MapService, mapStore } from '@geonimate/map';
import { TimelineService, timelineStore } from '@geonimate/timeline';
import { ConfigService, configStore } from '@geonimate/config';
import { settingsStore } from '@geonimate/settings';
import { ConfigToMapEffects } from './effects/config-to-map.effects';
import { ConfigToTimelineEffects } from './effects/config-to-timeline.effects';
import { MapToConfigTimelineEffects } from './effects/map-to-config-timeline.effects';
import { SettingsToTimelineMapEffects } from './effects/settings-to-timeline-map.effects';
import { TimelineKeyframeDragEffects } from './effects/timeline-keyframe-drag.effects';
import { MapPlayheadPropertyEffects } from './effects/map-playhead-property.effects';
import { provideManagerIntegrationEffects } from './manager-integration-bootstrap';

export function provideManager(): EnvironmentProviders {
    return makeEnvironmentProviders([
        ManagerService,
        StatePersistenceService,
        ConfigToMapEffects,
        ConfigToTimelineEffects,
        MapToConfigTimelineEffects,
        SettingsToTimelineMapEffects,
        TimelineKeyframeDragEffects,
        MapPlayheadPropertyEffects,
        provideManagerIntegrationEffects(),
        MapService,
        mapStore,
        TimelineService,
        timelineStore,
        ConfigService,
        configStore,
        settingsStore,
    ]);
}
