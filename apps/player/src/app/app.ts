import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PlayerAppComponent } from '@geonimate/shell';

@Component({
    selector: 'app-root',
    imports: [PlayerAppComponent],
    template: '<lib-player-app />',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
