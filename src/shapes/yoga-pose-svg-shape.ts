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
  useDefaultColorTheme,
  DefaultColorThemePalette,
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
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const theme = useDefaultColorTheme();
    
    // Get the actual color value from tldraw's theme
    const colorValue = theme[props.color].solid;
    const fillValue = props.fill === 'none' ? 'none' : theme[props.color].solid;
    

    
    // Apply style properties to the SVG content
    const styledSvg = props.svg
      // First remove the white background rectangle
      .replace(/<rect[^>]*fill="white"[^>]*\/?>/g, '')
      // Replace any hardcoded stroke colors
      .replace(/stroke="#[0-9A-Fa-f]{6}"/g, `stroke="${colorValue}"`)
      .replace(/stroke="[^"]*"/g, `stroke="${colorValue}"`)
      // Replace any hardcoded fill colors
      .replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${fillValue}"`)
      .replace(/fill="[^"]*"/g, `fill="${fillValue}"`)
      // Replace currentColor references
      .replace(/stroke="currentColor"/g, `stroke="${colorValue}"`)
      .replace(/fill="currentColor"/g, `fill="${colorValue}"`);



    // Parse the SVG to get the viewBox
    const parser = new DOMParser();
    const doc = parser.parseFromString(styledSvg, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');
    
    let viewBox = `0 0 ${props.w} ${props.h}`;
    if (svgElement && svgElement.getAttribute('viewBox')) {
      viewBox = svgElement.getAttribute('viewBox')!;
    }

    // Create the SVG element directly without div wrapper
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
        dangerouslySetInnerHTML: { __html: styledSvg },
      })
    );
  }

  /* Export renderer - parse SVG and return proper SVG elements */
  toSvg(shape: YogaPoseSvgShape) {
    const { svg, w, h, color, fill, opacity } = shape.props;
    

    
    // Use tldraw's actual color theme values instead of hardcoded hex values
    const getColorValue = (colorName: string): string => {
      // Try to get the color from tldraw's theme palette
      const lightTheme = DefaultColorThemePalette.lightMode;
      
      // Check if the color exists in the theme
      if (colorName in lightTheme) {
        const colorObj = lightTheme[colorName as keyof typeof lightTheme];
        return typeof colorObj === 'string' ? colorObj : colorObj.solid;
      }
      
      // Fallback color mapping for any missing colors
      const fallbackColors: Record<string, string> = {
        black: '#1d1d1d',
        blue: '#0000FF',
        green: '#00FF00',
        grey: '#808080',
        lightblue: '#ADD8E6',
        lightgreen: '#90EE90',
        lightred: '#FFB6C1',
        lightviolet: '#E6E6FA',
        orange: '#FFA500',
        red: '#FF0000',
        violet: '#800080',
        yellow: '#FFFF00',
        'light-blue': '#ADD8E6',
        'light-green': '#90EE90',
        'light-red': '#FFB6C1',
        'light-violet': '#E6E6FA',
        'light-orange': '#FFD700',
        'light-yellow': '#FFFFE0',
        'light-grey': '#D3D3D3',
        'light-black': '#696969',
      };
      
      return fallbackColors[colorName] || '#1d1d1d';
    };
    
    const colorValue = getColorValue(color);
    const fillValue = fill === 'none' ? 'none' : colorValue;
    

    
    // Apply style properties to the SVG content (same logic as component)
    const styledSvg = svg
      // First remove the white background rectangle
      .replace(/<rect[^>]*fill="white"[^>]*\/?>/g, '')
      // Replace any hardcoded stroke colors
      .replace(/stroke="#[0-9A-Fa-f]{6}"/g, `stroke="${colorValue}"`)
      .replace(/stroke="[^"]*"/g, `stroke="${colorValue}"`)
      // Replace any hardcoded fill colors
      .replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${fillValue}"`)
      .replace(/fill="[^"]*"/g, `fill="${fillValue}"`)
      // Replace currentColor references
      .replace(/stroke="currentColor"/g, `stroke="${colorValue}"`)
      .replace(/fill="currentColor"/g, `fill="${fillValue}"`);
    
  
    
    // Parse the SVG to get the viewBox
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const originalSvg = doc.querySelector('svg');
    
    let viewBox = `0 0 ${w} ${h}`;
    if (originalSvg && originalSvg.getAttribute('viewBox')) {
      viewBox = originalSvg.getAttribute('viewBox')!;
  
    } else {
  
    }
    
    // Check for parsing errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.error('❌ SVG parsing error:', parseError.textContent);
    }
    
    // Log the SVG content structure
    if (originalSvg) {

    }
    
    // Create a wrapper SVG element that contains the pose SVG
    const result = React.createElement('svg', {
      width: w,
      height: h,
      viewBox: viewBox,
      preserveAspectRatio: 'xMidYMid meet',
      xmlns: 'http://www.w3.org/2000/svg',
      style: { opacity },
      dangerouslySetInnerHTML: { __html: styledSvg },
    });
    

    
    return result;
  }
} 