import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DesignAppComponent } from '@geonimate/shell';

@Component({
    selector: 'app-root',
    imports: [DesignAppComponent],
    template: '<lib-design-app />',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
