import React from 'react';
import { TwoFAItem } from '../types';
import Item from './Item';

interface ItemListProps {
    items: TwoFAItem[];
    onRemove: (id: string) => void;
    onUpdate: (id: string, item: Partial<TwoFAItem>) => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
    viewMode: 'list' | 'grid';
}

const ItemList: React.FC<ItemListProps> = ({ items, onRemove, onUpdate, onMove, viewMode }) => {
    return (
        <div className={`item-list ${viewMode}-mode`}>
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
                />
            ))}
        </div>
    );
};

export default ItemList;
