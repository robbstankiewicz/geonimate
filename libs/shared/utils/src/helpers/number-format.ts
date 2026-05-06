export function formatNumber(value: number, decimals = 0): string {
    const formatted = value.toFixed(decimals);
    return Number(formatted) === 0 ? Math.abs(0).toFixed(decimals) : formatted;
}
