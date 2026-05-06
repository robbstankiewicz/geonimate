import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';

export class ErrorService {
    messageService = inject(MessageService);
    showError(summary = 'Error', detail = 'Something went wrong') {
        this.messageService.add({
            severity: 'error',
            summary,
            detail,
            sticky: true,
        });
    }
    showWarning(summary = 'Warning', detail = 'Something needs attention') {
        this.messageService.add({
            severity: 'warn',
            summary,
            detail,
            sticky: true,
        });
    }
}
