import React from 'react';
import { TwoFAItem } from '../types';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import IssuerIcon from './IssuerIcon';

interface SidebarListProps {
    items: TwoFAItem[];
    selectedItemId: string | null;
    onSelect: (id: string) => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
    isDragEnabled: boolean;
}

interface SidebarItemProps {
    item: TwoFAItem;
    isSelected: boolean;
    onSelect: () => void;
    isDragEnabled: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, isSelected, onSelect, isDragEnabled }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id, disabled: !isDragEnabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        '--issuer-color': item.color || '#e23e3e',
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
    } as React.CSSProperties;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`sidebar-list-item ${isSelected ? 'selected' : ''}`}
            onClick={onSelect}
        >
            <div className="item-icon-container small">
                <IssuerIcon issuer={item.issuer} />
            </div>
            <div className="sidebar-item-info">
                <span className="sidebar-item-issuer">{item.issuer}</span>
                <span className="sidebar-item-account" title={item.account}>{item.account}</span>
            </div>
        </div>
    );
};

const SidebarList: React.FC<SidebarListProps> = ({ items, selectedItemId, onSelect, isDragEnabled }) => {
    return (
        <div className="sidebar-list">
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {items.map((item, index) => {
                    const prevItem = index > 0 ? items[index - 1] : null;
                    const showCategoryHeader = (item.category || 'Geral') !== (prevItem?.category || 'Geral');

                    return (
                        <React.Fragment key={`frag-${item.id}`}>
                            {showCategoryHeader && (
                                <div className="category-header sidebar-header">
                                    {item.category || 'Geral'}
                                </div>
                            )}
                            <SidebarItem
                                key={item.id}
                                item={item}
                                isSelected={item.id === selectedItemId}
                                onSelect={() => onSelect(item.id)}
                                isDragEnabled={isDragEnabled}
                            />
                        </React.Fragment>
                    );
                })}
            </SortableContext>
        </div>
    );
};

export default SidebarList;
