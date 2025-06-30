import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface DroppableFlowsSectionProps {
  children: React.ReactNode;
  items: string[]; // Array of canvas IDs for sorting
}

export const DroppableFlowsSection: React.FC<DroppableFlowsSectionProps> = ({
  children,
  items,
}) => {
  return (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <div
        data-dnd-kit-droppable="true"
        data-dnd-kit-data={JSON.stringify({ type: "top-level" })}
        style={{
          minHeight: '100px',
          padding: '8px',
          borderRadius: '8px',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </SortableContext>
  );
}; 