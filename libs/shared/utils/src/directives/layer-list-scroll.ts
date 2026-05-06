import {
    computed,
    Directive,
    effect,
    ElementRef,
    inject,
    OnInit,
    signal,
} from '@angular/core';

@Directive({
    selector: '[layerListScroll]',
    host: {
        '(scroll)': 'onScroll($event)',
        '[style.paddingBottom]': 'paddingBottom()'
    },
})
export class LayerListScroll implements OnInit {
    private elementRef = inject(ElementRef);
    static scroll = signal<number>(0);
    static minHeight = signal<number>(Infinity);
    static readonly BASE_PADDING = 100;
    private paddingBottomPx = signal(LayerListScroll.BASE_PADDING)
    protected paddingBottom = computed(() => `${this.paddingBottomPx()}px`)

    onScroll(event: Event) {
        LayerListScroll.scroll.set((event.target as HTMLElement).scrollTop);
    }

    constructor() {
        effect(() => {
            const scroll = LayerListScroll.scroll();
            const element = this.elementRef.nativeElement;
            if (element.scrollTop !== scroll) {
                element.scrollTop = scroll;
            }
        });
        effect(() => {
            const minHeight = LayerListScroll.minHeight();
            const currentHeight = this.elementRef.nativeElement.offsetHeight;
            if (currentHeight > minHeight) {
                const padding = currentHeight - minHeight;
                this.paddingBottomPx.set(padding + LayerListScroll.BASE_PADDING)
            }
        })

    }

    ngOnInit(): void {
        const initHeight = this.elementRef.nativeElement.offsetHeight
        const minHeight = LayerListScroll.minHeight();
        if (initHeight < minHeight) {
            LayerListScroll.minHeight.set(initHeight);
            this.paddingBottomPx.set(LayerListScroll.BASE_PADDING)
        } else {
            const padding = initHeight - minHeight;
            this.paddingBottomPx.set(padding + LayerListScroll.BASE_PADDING)
        }
    }



}

