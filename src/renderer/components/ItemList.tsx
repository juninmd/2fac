import React from 'react';
import { TwoFAItem } from '../types';
import Item from './Item';

interface ItemListProps {
    items: TwoFAItem[];
    onRemove: (id: string) => void;
    onUpdate: (id: string, item: Partial<TwoFAItem>) => void;
    viewMode: 'list' | 'grid';
}

const ItemList: React.FC<ItemListProps> = ({ items, onRemove, onUpdate, viewMode }) => {
    // Sort items by issuer then account
    const sortedItems = [...items].sort((a, b) => {
        if (a.issuer !== b.issuer) {
            return a.issuer.localeCompare(b.issuer);
        }
        return a.account.localeCompare(b.account);
    });

    return (
        <div className={`item-list ${viewMode}-mode`}>
            {sortedItems.map(item => (
                <Item
                    key={item.id}
                    item={item}
                    onRemove={onRemove}
                    onUpdate={onUpdate}
                    viewMode={viewMode}
                />
            ))}
        </div>
    );
};

export default ItemList;
