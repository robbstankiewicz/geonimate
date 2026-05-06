import { StaticTextAlign } from '@geonimate/shared-utils';

export const STATIC_TEXT_ALIGN_OPTIONS = [
    { value: 'left', icon: 'pi pi-align-left', label: 'Align left' },
    { value: 'center', icon: 'pi pi-align-center', label: 'Align center' },
    { value: 'right', icon: 'pi pi-align-right', label: 'Align right' },
] as const satisfies {
    value: StaticTextAlign;
    icon: string;
    label: string;
}[];
