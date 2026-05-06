/**
    @returns index where target should be placed in order
*/
export function findBestIndex(array: number[], target: number): number {
    let left = 0;
    let right = array.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2)
        if (array[mid] > target) {
            right = mid - 1
        } else if(array[mid] < target) {
            left = mid + 1
        } else {
            return mid + 1
        }
    }
    return left
}
