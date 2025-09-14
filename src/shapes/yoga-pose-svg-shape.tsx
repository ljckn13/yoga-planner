import React from 'react';
import {
  SVGContainer,
  ShapeUtil,
  Rectangle2d,
  type TLBaseShape,
  type RecordProps,
  T,
  type SvgExportContext,
  DefaultColorStyle,
  DefaultSizeStyle,
  type TLDefaultColorStyle,
  type TLDefaultSizeStyle,
} from 'tldraw';

/* Declare the record type */
export type YogaPoseSvgShape = TLBaseShape<
  'yoga-pose-svg',
  { 
    svg: string; 
    w: number; 
    h: number;
    color: TLDefaultColorStyle;
    size: TLDefaultSizeStyle;
    opacity: number;
  }
>;

/* Implement the util */
export class YogaPoseSvgShapeUtil extends ShapeUtil<YogaPoseSvgShape> {
  static override type = 'yoga-pose-svg' as const;
  static override props: RecordProps<YogaPoseSvgShape> = {
    svg: T.string,
    w: T.number,
    h: T.number,
    color: DefaultColorStyle,
    size: DefaultSizeStyle,
    opacity: T.number,
  };

  getDefaultProps(): YogaPoseSvgShape['props'] {
    return {
      svg: '',
      w: 100,
      h: 100,
      color: 'black',
      size: 'm',
      opacity: 1,
    };
  }

  /* Hit-testing & snapping geometry */
  getGeometry(shape: YogaPoseSvgShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: false,
    });
  }

  /* Indicator for selection */
  indicator(shape: YogaPoseSvgShape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }

  /* React renderer – drop raw markup into the canvas */
  component(shape: YogaPoseSvgShape) {
    return (
      <SVGContainer id={shape.id}>
        <div
          style={{
            width: shape.props.w,
            height: shape.props.h,
            opacity: shape.props.opacity,
            color: shape.props.color,
          }}
          dangerouslySetInnerHTML={{ __html: shape.props.svg }}
        />
      </SVGContainer>
    );
  }

  /* Export renderer - return a React SVG element as tldraw expects */
  toSvg(shape: YogaPoseSvgShape, ctx: SvgExportContext) {
    const { svg, w, h, opacity, color } = shape.props;
    
    // Remove any white background rects to avoid export backgrounds
    const cleaned = svg.replace(/<rect[^>]*fill="white"[^>]*\/?>/g, '');
    
    // Inject width/height and simple styling
    const scaledSvg = cleaned.replace(
      /<svg([^>]*)>/,
      `<svg$1 width="${w}" height="${h}" style="color: ${color}; opacity: ${opacity};">`
    );
    
    // Return a React element with the inner markup
    const inner = scaledSvg.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>[\s\S]*$/g, '');
    return React.createElement('svg', {
      width: w,
      height: h,
      dangerouslySetInnerHTML: { __html: inner },
    });
  }
} 