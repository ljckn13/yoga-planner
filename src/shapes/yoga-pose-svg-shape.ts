import React from 'react';
import {
  SVGContainer,
  ShapeUtil,
  Rectangle2d,
  type TLBaseShape,
  type RecordProps,
  T,
} from 'tldraw';

/* Declare the record type */
export type YogaPoseSvgShape = TLBaseShape<
  'yoga-pose-svg',
  { svg: string; w: number; h: number }
>;

/* Implement the util */
export class YogaPoseSvgShapeUtil extends ShapeUtil<YogaPoseSvgShape> {
  static override type = 'yoga-pose-svg' as const;
  static override props: RecordProps<YogaPoseSvgShape> = {
    svg: T.string,
    w: T.number,
    h: T.number,
  };

  getDefaultProps(): YogaPoseSvgShape['props'] {
    return { svg: '', w: 255, h: 255 };
  }

  /* Hit-testing & snapping geometry */
  getGeometry({ props }: YogaPoseSvgShape) {
    return new Rectangle2d({ width: props.w, height: props.h, isFilled: true });
  }

  /* Indicator for selection */
  indicator(shape: YogaPoseSvgShape) {
    return React.createElement('rect', {
      width: shape.props.w,
      height: shape.props.h,
      fill: 'none',
      stroke: 'var(--color-selected)',
      strokeWidth: 2,
    });
  }

  /* React renderer – drop raw markup into the canvas */
  component({ props }: YogaPoseSvgShape) {
    return React.createElement(SVGContainer, {}, 
      React.createElement('g', {
        dangerouslySetInnerHTML: { __html: props.svg },
        style: { 
          width: props.w, 
          height: props.h,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      })
    );
  }

  /* Optional: make exports look perfect */
  toSvg(shape: YogaPoseSvgShape) {
    return React.createElement('g', {
      dangerouslySetInnerHTML: { __html: shape.props.svg },
      width: shape.props.w,
      height: shape.props.h
    });
  }
} 