import { findBestIndex } from "./find";

describe("find next", () => {
    fit("should return next index", () => {
        expect(findBestIndex([0, 100, 1000, 2000, 3000, 4000], 1200)).toEqual(3)
        expect(findBestIndex([0, 100, 1000, 2000, 3000, 4000], 50)).toEqual(1)
        expect(findBestIndex([0, 100, 1000, 2000, 3000, 4000], 1000)).toEqual(3)

        expect(findBestIndex([0, 100], 1200)).toEqual(2)
        expect(findBestIndex([0, 50, 100], 10)).toEqual(1)
        expect(findBestIndex([100], 1)).toEqual(0)

        expect(findBestIndex([100, 200], 1000)).toEqual(2)
        expect(findBestIndex([100, 1000], 500)).toEqual(1)
        expect(findBestIndex([100, 1000], 1000)).toEqual(2)
        expect(findBestIndex([], 1000)).toEqual(0)
    })
})
