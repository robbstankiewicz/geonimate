import {
    Component,
    input,
    output,
    ChangeDetectionStrategy,
    signal,
    computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'lib-image-file-picker',
    imports: [FormsModule, ButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="flex flex-col gap-2">
            <input
                type="file"
                [accept]="accept()"
                (change)="onFileSelected($event)"
                #fileInput
                style="display: none;" />
            <div class="flex gap-2">
                <button
                    pButton
                    type="button"
                    [label]="hasValue() ? 'Change Image' : 'Choose Image'"
                    (click)="fileInput.click()"
                    class="p-button-sm"></button>
                @if (hasValue()) {
                <button
                    pButton
                    type="button"
                    label="Clear"
                    (click)="clearImage()"
                    class="p-button-sm p-button-secondary"></button>
                }
            </div>

            @if (errorMessage()) {
            <div class="text-red-500 text-sm mt-1">
                {{ errorMessage() }}
            </div>
            } @if (selectedFile()) {
            <div class="text-sm text-gray-500 mt-1">
                {{ selectedFile()!.name }} ({{ fileSizeKb() }} KB)
            </div>
            } @if (previewUrl()) {
            <div class="mt-2">
                <img
                    [src]="previewUrl()"
                    alt="Preview"
                    style="max-width: 200px; max-height: 200px; border: 1px solid #ccc; border-radius: 4px;" />
            </div>
            }
        </div>
    `,
})
export class ImageFilePicker {
    value = input<string>('');
    valueChange = output<string>();
    fileSelected = output<File>();
    maxSize = input<number>(2 * 1024 * 1024);
    accept = input<string>('image/*');

    selectedFile = signal<File | null>(null);
    errorMessage = signal<string | null>(null);

    hasValue = computed(() => {
        return !!this.value();
    });

    previewUrl = computed(() => {
        return this.value() || null;
    });

    fileSizeKb = computed(() => {
        const file = this.selectedFile();
        return file ? (file.size / 1024).toFixed(1) : '0';
    });

    async onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        this.errorMessage.set(null);

        if (!input.files || !input.files[0]) {
            return;
        }

        const file = input.files[0];

        if (!file.type.startsWith('image/')) {
            this.errorMessage.set('Only image files are allowed');
            input.value = '';
            return;
        }

        if (file.size > this.maxSize()) {
            const mb = (this.maxSize() / 1024 / 1024).toFixed(0);
            this.errorMessage.set(`File size must be less than ${mb}MB`);
            input.value = '';
            return;
        }

        this.selectedFile.set(file);

        try {
            const base64 = await this.fileToBase64(file);
            this.valueChange.emit(base64);
            this.fileSelected.emit(file);
        } catch (error) {
            this.errorMessage.set('Failed to process image');
            console.error('Error converting file to base64:', error);
        }

        input.value = '';
    }

    clearImage() {
        this.selectedFile.set(null);
        this.errorMessage.set(null);
        this.valueChange.emit('');
    }

    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }
}
