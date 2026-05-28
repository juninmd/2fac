import { reorder } from './arrayUtils.js';

describe('arrayUtils', () => {
  describe('reorder', () => {
    it('should move an item from one position to another', () => {
      const list = ['a', 'b', 'c'];
      const result = reorder(list, 0, 1);
      expect(result).toEqual(['b', 'a', 'c']);
    });

    it('should move an item to the end', () => {
      const list = ['a', 'b', 'c'];
      const result = reorder(list, 0, 2);
      expect(result).toEqual(['b', 'c', 'a']);
    });

    it('should handle same start and end index', () => {
      const list = ['a', 'b', 'c'];
      const result = reorder(list, 1, 1);
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });
});
