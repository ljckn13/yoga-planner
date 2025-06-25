import { BaseBoxShapeUtil, HTMLContainer } from 'tldraw';
import type { TLBaseShape } from 'tldraw';
import { Category } from '../types/category';
import type { SubCategory } from '../types/category';
import React from 'react';

// Define the yoga pose shape type
export type YogaPoseShape = TLBaseShape<
  'yoga-pose',
  {
    w: number;
    h: number;
    poseId: number;
    name: string;
    translation: string;
    category: Category;
    subCategory?: SubCategory;
    svgPath: string;
  }
>;

// Placeholder shape utility - will be replaced with actual implementation
export class YogaPoseShapeUtil extends BaseBoxShapeUtil<YogaPoseShape> {
  static override type = 'yoga-pose' as const;

  getDefaultProps(): YogaPoseShape['props'] {
    return {
      w: 80,
      h: 80,
      poseId: 1,
      name: 'Placeholder Pose',
      translation: 'Placeholder',
      category: Category.LAYING,
      svgPath: '',
    };
  }

  component(shape: YogaPoseShape) {
    const { w, h, name, svgPath } = shape.props;

    return React.createElement(
      HTMLContainer,
      {},
      React.createElement(
        'div',
        {
          style: {
            width: w,
            height: h,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            cursor: 'pointer',
            userSelect: 'none',
          },
        },
        // SVG Image
        svgPath && React.createElement('img', {
          src: svgPath,
          alt: name,
          style: {
            width: w - 10,
            height: h - 20,
            objectFit: 'contain',
          },
        }),
        // Pose name
        React.createElement(
          'div',
          { 
            style: { 
              fontSize: '10px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginTop: '2px',
              color: '#450D59',
              textShadow: '0 0 2px white',
            } 
          },
          name
        )
      )
    );
  }

  indicator(shape: YogaPoseShape) {
    return React.createElement('rect', {
      width: shape.props.w,
      height: shape.props.h,
    });
  }
}

// Shape definition will be added when custom shapes are implemented