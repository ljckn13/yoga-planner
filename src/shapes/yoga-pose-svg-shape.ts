import React from 'react';
import {
  SVGContainer,
  ShapeUtil,
  Rectangle2d,
  type TLBaseShape,
  type RecordProps,
  T,
  DefaultColorStyle,
  DefaultFillStyle,
  type TLDefaultColorStyle,
  type TLDefaultFillStyle,
} from 'tldraw';

/* Declare the record type */
export type YogaPoseSvgShape = TLBaseShape<
  'yoga-pose-svg',
  { 
    svg: string; 
    w: number; 
    h: number;
    color: TLDefaultColorStyle;
    fill: TLDefaultFillStyle;
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
    fill: DefaultFillStyle,
    opacity: T.number,
  };

  // Enable style panel for color, fill, and opacity
  static styles = {
    color: true,
    fill: true,
    dash: false,
    size: false,
    font: false,
    align: false,
    verticalAlign: false,
    opacity: true,
  };

  getDefaultProps(): YogaPoseSvgShape['props'] {
    return { 
      svg: '', 
      w: 255, 
      h: 255,
      color: 'black',
      fill: 'none',
      opacity: 1,
    };
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
    const parser = new DOMParser();
    const doc = parser.parseFromString(props.svg, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    let viewBox = `0 0 ${props.w} ${props.h}`;
    let vbW = props.w;
    let vbH = props.h;
    if (svgEl) {
      const vb = svgEl.getAttribute('viewBox');
      if (vb) {
        viewBox = vb;
        const parts = vb.split(/\s+/);
        if (parts.length >= 4) {
          vbW = parseFloat(parts[2]);
          vbH = parseFloat(parts[3]);
        }
      }

      // Remove only immediate root-level white rects matching the viewBox size
      const toRemove: Element[] = [];
      Array.from(svgEl.children).forEach((child) => {
        if (child.tagName.toLowerCase() === 'rect') {
          const fill = (child.getAttribute('fill') || '').toLowerCase();
          const w = parseFloat(child.getAttribute('width') || '-1');
          const h = parseFloat(child.getAttribute('height') || '-1');
          if ((fill === 'white' || fill === '#fff' || fill === '#ffffff') && Math.abs(w - vbW) < 0.01 && Math.abs(h - vbH) < 0.01) {
            toRemove.push(child);
          }
        }
      });
      toRemove.forEach((el) => el.remove());
    }

    const inner = svgEl ? svgEl.innerHTML : props.svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '');

    return React.createElement(SVGContainer, {}, 
      React.createElement('svg', {
        width: props.w,
        height: props.h,
        viewBox: viewBox,
        preserveAspectRatio: 'xMidYMid meet',
        xmlns: 'http://www.w3.org/2000/svg',
        style: { 
          opacity: props.opacity,
          width: props.w, 
          height: props.h,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        dangerouslySetInnerHTML: { __html: inner },
      })
    );
  }

  /* Export renderer - return a React SVG element as tldraw expects */
  toSvg(shape: YogaPoseSvgShape) {
    const { svg, w, h, opacity } = shape.props;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    let viewBox = `0 0 ${w} ${h}`;
    let vbW = w;
    let vbH = h;
    if (svgEl) {
      const vb = svgEl.getAttribute('viewBox');
      if (vb) {
        viewBox = vb;
        const parts = vb.split(/\s+/);
        if (parts.length >= 4) {
          vbW = parseFloat(parts[2]);
          vbH = parseFloat(parts[3]);
        }
      }

      // Remove only root-level white rect backgrounds
      const toRemove: Element[] = [];
      Array.from(svgEl.children).forEach((child) => {
        if (child.tagName.toLowerCase() === 'rect') {
          const fill = (child.getAttribute('fill') || '').toLowerCase();
          const cw = parseFloat(child.getAttribute('width') || '-1');
          const ch = parseFloat(child.getAttribute('height') || '-1');
          if ((fill === 'white' || fill === '#fff' || fill === '#ffffff') && Math.abs(cw - vbW) < 0.01 && Math.abs(ch - vbH) < 0.01) {
            toRemove.push(child);
          }
        }
      });
      toRemove.forEach((el) => el.remove());
    }

    const inner = svgEl ? svgEl.innerHTML : svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '');

    return React.createElement('svg', {
      width: w,
      height: h,
      viewBox: viewBox,
      style: { opacity },
      dangerouslySetInnerHTML: { __html: inner },
    });
  }
} 