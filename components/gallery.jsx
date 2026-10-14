'use client';
import { useState } from 'react';
import Image from 'next/image';
export default function Gallery({ images, locale, title }) {
  const [current, setCurrent] = useState(images.findIndex(i => i.src.includes('kiwi-main')) > -1 ? images.findIndex(i => i.src.includes('kiwi-main')) : 0); const image = images[current];
  const large = image.src.includes('kiwi-main');
  const thumbnail = /kiwi-(crate|orchard|pallet)/.test(image.src);
  return <div className="gallery" aria-label={title}><div className="gallery-stage"><Image src={image.src} width={large ? 390 : thumbnail ? 98 : 216} height={large ? 358 : thumbnail ? 76 : 156} alt={image.alt[locale]} priority className={large ? 'gallery-large' : 'gallery-native'} sizes={large ? '(max-width: 700px) 90vw, 390px' : thumbnail ? '98px' : '216px'}/></div>{images.length > 1 && <div className="gallery-thumbs">{images.map((item, index) => <button key={item.src} className={current === index ? 'selected' : ''} type="button" onClick={() => setCurrent(index)} aria-pressed={current === index} aria-label={item.alt[locale]}><Image src={item.src} width={98} height={76} alt="" /></button>)}</div>}</div>;
}
