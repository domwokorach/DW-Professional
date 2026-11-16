import type { CSSProperties, ImgHTMLAttributes } from 'react';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> & {
  src: string | { src: string };
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
  placeholder?: string;
};

const FILL: CSSProperties = { position: 'absolute', height: '100%', width: '100%', left: 0, top: 0, right: 0, bottom: 0, color: 'transparent' };

/** Browser replacement for next/image: a plain <img> (files are served from public/ as they are). */
export default function Image({ src, fill, priority, quality: _q, unoptimized: _u, placeholder: _p, style, loading, ...rest }: Props) {
  return <img {...rest} src={typeof src === 'string' ? src : src.src} loading={loading ?? (priority ? 'eager' : 'lazy')} decoding="async" style={fill ? { ...FILL, ...style } : { color: 'transparent', ...style }} />;
}
