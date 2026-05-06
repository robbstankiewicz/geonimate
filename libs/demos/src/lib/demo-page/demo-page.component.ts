import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DEMO_REGISTRY } from '../demo-registry';

@Component({
    selector: 'lib-demo-page',
    imports: [RouterLink, ButtonModule],
    templateUrl: './demo-page.component.html',
    styleUrl: './demo-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoPageComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly demos = inject(DEMO_REGISTRY);
    // todo demo page?
}
