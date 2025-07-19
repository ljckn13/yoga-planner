import React from 'react';
import renameSvgContent from './rename.svg?raw';
import duplicateSvgContent from './duplicate.svg?raw';
import deleteSvgContent from './delete.svg?raw';

export const RenameIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <div 
    dangerouslySetInnerHTML={{ __html: renameSvgContent }}
    className={className}
    style={style}
  />
);

export const DuplicateIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <div 
    dangerouslySetInnerHTML={{ __html: duplicateSvgContent }}
    className={className}
    style={style}
  />
);

export const DeleteIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <div 
    dangerouslySetInnerHTML={{ __html: deleteSvgContent }}
    className={className}
    style={style}
  />
); 