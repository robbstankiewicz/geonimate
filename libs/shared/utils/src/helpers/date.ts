import moment from 'moment';

export function formatDate(date: Date | string, format: string): string {
    const m = moment(date);
    if (!m.isValid()) {
        return String(date);
    }
    return m.format(format);
}
