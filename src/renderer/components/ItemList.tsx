import React from 'react';
import { TwoFAItem } from '../types';
import { SortableContext, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Item from './Item';

interface ItemListProps {
    items: TwoFAItem[];
    onRemove: (id: string) => void;
    onUpdate: (id: string, item: Partial<TwoFAItem>) => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
    viewMode: 'list' | 'grid';
    isDragEnabled: boolean;
}

const ItemList: React.FC<ItemListProps> = ({ items, onRemove, onUpdate, onMove, viewMode, isDragEnabled }) => {
    const strategy = viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy;

    return (
        <div className={`item-list ${viewMode}-mode`}>
            <SortableContext items={items.map(i => i.id)} strategy={strategy}>
                {items.map((item, index) => (
                    <Item
                        key={item.id}
                        item={item}
                        onRemove={onRemove}
                        onUpdate={onUpdate}
                        onMove={onMove}
                        viewMode={viewMode}
                        isFirst={index === 0}
                        isLast={index === items.length - 1}
                        isDragEnabled={isDragEnabled}
                    />
                ))}
            </SortableContext>
        </div>
    );
};

export default ItemList;
