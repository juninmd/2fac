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

    // Group items by category to preserve existing global order array (DND) but visually distinct
    // However, DND with visually broken lists using a single SortableContext might look weird.
    // For simplicity, we just inject Category Headers if a category changes sequentially.
    // If user wants them strictly grouped, they drag them together.

    return (
        <div className={`item-list ${viewMode}-mode`}>
            <SortableContext items={items.map(i => i.id)} strategy={strategy}>
                {items.map((item, index) => {
                    const prevItem = index > 0 ? items[index - 1] : null;
                    const showCategoryHeader = (item.category || 'Geral') !== (prevItem?.category || 'Geral');

                    return (
                        <React.Fragment key={`frag-${item.id}`}>
                            {showCategoryHeader && (
                                <div className="category-header">
                                    {item.category || 'Geral'}
                                </div>
                            )}
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
                        </React.Fragment>
                    );
                })}
            </SortableContext>
        </div>
    );
};

export default ItemList;
