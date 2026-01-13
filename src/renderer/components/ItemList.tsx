import React from 'react';
import { TwoFAItem } from '../types';
import Item from './Item';

interface ItemListProps {
    items: TwoFAItem[];
    onRemove: (id: string) => void;
}

const ItemList: React.FC<ItemListProps> = ({ items, onRemove }) => {
    // Group items by issuer
    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.issuer]) {
            acc[item.issuer] = [];
        }
        acc[item.issuer].push(item);
        return acc;
    }, {} as Record<string, TwoFAItem[]>);

    const issuers = Object.keys(groupedItems).sort();

    return (
        <div className="item-list">
            {issuers.map(issuer => (
                <div key={issuer} className="issuer-group">
                    <h2 className="group-title">{issuer}</h2>
                    <div className="items-grid">
                        {groupedItems[issuer].map(item => (
                            <Item key={item.id} item={item} onRemove={onRemove} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ItemList;
