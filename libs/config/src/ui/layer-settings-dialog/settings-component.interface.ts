import { Layer } from "../../models";

export interface SettingsComponent {
    getValues(): Partial<Layer>;
}
