'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';

export function ProductGallery({ product }: { product: Product }) {
  const images = product.images?.length ? product.images : product.primary_image ? [product.primary_image] : [];
  const [active, setActive] = useState(images[0]?.image);
  return (
    <div className="grid gap-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--ui-surface)]">
        {active ? <img src={active} alt={product.name} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((image) => (
          <button key={image.id} onClick={() => setActive(image.image)} className="relative aspect-square overflow-hidden rounded-lg border border-ink/10">
            <img src={image.image} alt={image.alt_text || product.name} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
