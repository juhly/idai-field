import {
    bigger, intersect, removeFrom, smaller, subtractArrays, takeUntil,
    takeWhile, flow, map, times, filter, isNot, sameAs, differentFrom, includedIn, subtract
} from '../../../app/util/list-util';

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ListUtil', () => {

        it('intersect - intersection',() => {

            expect(intersect([[1,2],[2,3],[2,4]])).toEqual([2]);
        });


        it('intersect - no intersection',() => {

            expect(intersect([[1,2],[3,4],[5,6]])).toEqual([]);
        });


        it('intersect - no intersection where only partial intersection',() => {

            expect(intersect([[1,2],[2,3],[3,4]])).toEqual([]);
        });


        it('subtract', () =>

            expect(

                subtract([3,4,5])([1,2,3])

            ).toEqual([1,2])
        );


        it('subtract: from empty list', () =>

            expect(

                subtract([3,4,5])([])

            ).toEqual([])
        );


        it('subtract: empty list', () => {

            expect(

                subtract([])([1,2,3])

            ).toEqual([1,2,3]);
        });


        it('subtract: no intersection', () =>

            expect(

                subtract([4,5,6])([1,2,3])

            ).toEqual([1,2,3])
        );


        it('subtract: usable with flow',() =>

            expect(

                flow(
                    subtract([3,4,5]),
                    filter(smaller(2))
                )([1,2,3])

            ).toEqual([1])
        );


        it('subtractArrays',() =>

            expect(

                subtractArrays([[1,2],[2,2]])([1,2,3,4])

            ).toEqual([3,4])
        );



        it('subtractArrays: usable with flow',() =>

            expect(

                flow(
                    subtractArrays([[1,2],[2,2]]),
                    filter(bigger(3))
                )([1,2,3,4])

            ).toEqual([4])
        );


        it('take five', () =>

            expect(takeWhile(smaller(20))
                ([7, 9, 10, 13, 17, 20])).toEqual([7, 9, 10, 13, 17])
        );


        it('take none', () =>

            expect(takeWhile(bigger(23))
                ([7, 9, 10, 13, 17, 20])).toEqual([])
        );


        it('take all', () =>

            expect(takeWhile(bigger(1))
                ([7, 9])).toEqual([7, 9])
        );


        it('empty', () =>

            expect(takeWhile(bigger(23))
                ([])).toEqual([])
        );


        it('until: take two', () => {

            expect(takeUntil(bigger(7))
                ([7, 9, 11])).toEqual([7, 9]);
        });


        it('until: take all', () =>

            expect(takeUntil(bigger(13))
                ([7, 9, 11])).toEqual([7, 9, 11])
        );


        it('until: empty', () =>

            expect(takeUntil(bigger(13))
                ([])).toEqual([])
        );


        it('removeFrom', () =>

            expect(removeFrom([1,2,13,13,4])(13)).toEqual([1,2,4])
        );


        it('removeFrom: nothing', () =>

            expect(removeFrom([1,2,7,4])(13)).toEqual([1,2,7,4])
        );


        it('removeFrom: everything', () =>

            expect(removeFrom([1,1])(1)).toEqual([])
        );


        it('times', () =>

            expect(times(2)
                (2)).toEqual(4)
        );


        it('map', () =>

            expect(map(times(2))
                ([2,4])).toEqual(([4,8]))
        );


        it('filter', () =>

            expect(filter(smaller(4))
                ([2,4,1,5,7,8,2,1,0])).toEqual(([2,1,2,1,0]))
        );


        it('flow', () =>

            expect(flow(
                    takeWhile(bigger(4)),
                    map(times(2)),
                    filter(smaller(16)),
                    filter(differentFrom(12)),
                    filter(includedIn([14]))
                )
                ([5,6,7,8,4,16,5])).toEqual([14])
        );
    });
}