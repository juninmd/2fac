import { arrayMove } from '@dnd-kit/sortable';

export const reorder = <T>(list: T[], startIndex: number, endIndex: number): T[] => {
    return arrayMove(list, startIndex, endIndex);
};
