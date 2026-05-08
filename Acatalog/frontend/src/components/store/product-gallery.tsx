'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getMediaUrl } from '@/lib/api';
import type { Product } from '@/lib/types';

export function ProductGallery({ product }: { product: Product }) {
  const images = product.images?.length ? product.images : product.primary_image ? [product.primary_image] : [];
  const [active, setActive] = useState(images[0]?.image);
  return (
    <div className="grid gap-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
        {active ? <Image src={getMediaUrl(active)} alt={product.name} fill className="object-cover" /> : null}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((image) => (
          <button key={image.id} onClick={() => setActive(image.image)} className="relative aspect-square overflow-hidden rounded-lg border border-ink/10">
            <Image src={getMediaUrl(image.image)} alt={image.alt_text || product.name} fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
