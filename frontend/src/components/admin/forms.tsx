'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GripVertical, ImagePlus, LoaderCircle, Plus, Star, Trash2, UploadCloud, X } from 'lucide-react';
import { apiErrorMessage, adminApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast-provider';
import type { Product, ProductImage } from '@/lib/types';
import styles from '@/app/admin/produtos/products.module.css';

const slugify = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

type ProductFormProps = {
  editingProduct?: Product | null;
  isEditingLoading?: boolean;
  onCancelEdit?: () => void;
};

type ImageItem = {
  localId: string;
  existingId?: number;
  file?: File;
  previewUrl: string;
  altText: string;
  isPrimary: boolean;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  deleted?: boolean;
};

type SpecificationRow = {
  id: string;
  key: string;
  value: string;
};

const MAX_IMAGES = 6;
const MIN_IMAGES = 4;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const SUGGESTED_SPEC_KEYS = ['Processador', 'Memoria RAM', 'Armazenamento', 'Placa de video', 'Tela', 'Conectividade', 'Garantia'];

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];

function toImageItems(images: ProductImage[] | undefined, productName: string) {
  return (images ?? []).map((image, index) => ({
    localId: `existing-${image.id}`,
    existingId: image.id,
    previewUrl: image.image,
    altText: image.alt_text || productName,
    isPrimary: Boolean(image.is_primary),
    progress: 100,
    status: 'success' as const,
  }));
}

function newSpecRow(key = '', value = ''): SpecificationRow {
  return {
    id: `spec-${crypto.randomUUID()}`,
    key,
    value,
  };
}

function toSpecRows(specifications?: Record<string, string>) {
  const rows = Object.entries(specifications ?? {})
    .filter(([key, value]) => key.trim() && String(value).trim())
    .map(([key, value]) => newSpecRow(key, String(value)));
  return rows.length ? rows : [newSpecRow(), newSpecRow(), newSpecRow()];
}

function rowsToSpecifications(rows: SpecificationRow[]) {
  return rows.reduce<Record<string, string>>((acc, row) => {
    const key = row.key.trim();
    const value = row.value.trim();
    if (key && value) acc[key] = value;
    return acc;
  }, {});
}

export function ProductForm({ editingProduct, isEditingLoading = false, onCancelEdit }: ProductFormProps) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [urlBatch, setUrlBatch] = useState('');
  const [urlImportStatus, setUrlImportStatus] = useState<Array<{ url: string; status: 'success' | 'error'; message: string }>>([]);
  const [specRows, setSpecRows] = useState<SpecificationRow[]>(() => toSpecRows());
  const hydratedProductSignatureRef = useRef<string | null>(null);
  const hydratedSpecsSignatureRef = useRef<string | null>(null);

  const categories = useQuery({ queryKey: ['admin-categories'], queryFn: adminApi.categories });
  const brands = useQuery({ queryKey: ['admin-brands'], queryFn: adminApi.brands });

  useEffect(() => {
    const imageIds = (editingProduct?.images ?? []).map((item) => item.id).join(',');
    const signature = editingProduct?.slug ? `${editingProduct.slug}:${imageIds}` : null;
    if (signature === hydratedProductSignatureRef.current) return;
    hydratedProductSignatureRef.current = signature;
    setImages(toImageItems(editingProduct?.images, editingProduct?.name ?? 'Produto'));
  }, [editingProduct?.slug, editingProduct?.images, editingProduct?.name]);

  useEffect(() => {
    const signature = editingProduct?.slug
      ? `${editingProduct.slug}:${JSON.stringify(editingProduct.specifications ?? {})}`
      : 'new-product';
    if (signature === hydratedSpecsSignatureRef.current) return;
    hydratedSpecsSignatureRef.current = signature;
    setSpecRows(toSpecRows(editingProduct?.specifications));
  }, [editingProduct?.slug, editingProduct?.specifications]);

  const activeImages = useMemo(() => images.filter((image) => !image.deleted), [images]);
  const imageCount = activeImages.length;

  const ensurePrimary = (list: ImageItem[]) => {
    const hasPrimary = list.some((image) => image.isPrimary && !image.deleted);
    if (hasPrimary) return list;
    const firstIndex = list.findIndex((image) => !image.deleted);
    if (firstIndex >= 0) list[firstIndex].isPrimary = true;
    return list;
  };

  const updateImage = (localId: string, partial: Partial<ImageItem>) => {
    setImages((previous) => previous.map((image) => (image.localId === localId ? { ...image, ...partial } : image)));
  };

  const removeImage = (localId: string) => {
    setImages((previous) => ensurePrimary(previous.map((image) => (image.localId === localId ? { ...image, deleted: true, isPrimary: false } : image))).filter((image) => !image.deleted || image.existingId));
  };

  const setPrimary = (localId: string) => {
    setImages((previous) => previous.map((image) => ({ ...image, isPrimary: image.localId === localId && !image.deleted })));
  };

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= activeImages.length || to >= activeImages.length) return;
    const reordered = [...activeImages];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const hidden = images.filter((image) => image.deleted);
    setImages(ensurePrimary([...reordered, ...hidden]));
  };

  const updateSpecRow = (id: string, partial: Partial<SpecificationRow>) => {
    setSpecRows((previous) => previous.map((row) => (row.id === id ? { ...row, ...partial } : row)));
  };

  const addSpecRow = (key = '') => {
    setSpecRows((previous) => [...previous, newSpecRow(key)]);
  };

  const removeSpecRow = (id: string) => {
    setSpecRows((previous) => {
      const next = previous.filter((row) => row.id !== id);
      return next.length ? next : [newSpecRow()];
    });
  };

  const addSuggestedSpecs = () => {
    setSpecRows((previous) => {
      const currentKeys = new Set(previous.map((row) => row.key.trim().toLowerCase()).filter(Boolean));
      const missing = SUGGESTED_SPEC_KEYS.filter((key) => !currentKeys.has(key.toLowerCase())).map((key) => newSpecRow(key));
      return missing.length ? [...previous.filter((row) => row.key.trim() || row.value.trim()), ...missing] : previous;
    });
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const incoming = Array.from(fileList);
    if (activeImages.length + incoming.length > MAX_IMAGES) {
      notify(`Limite de ${MAX_IMAGES} imagens por produto.`);
      return;
    }

    const mapped: ImageItem[] = [];
    for (const file of incoming) {
      if (!acceptedTypes.includes(file.type)) {
        notify('Formato invalido. Use JPG, PNG ou WEBP.');
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        notify(`Arquivo acima de ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      mapped.push({
        localId: `new-${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        altText: editingProduct?.name ?? '',
        isPrimary: false,
        progress: 0,
        status: 'idle',
      });
    }

    setImages((previous) => ensurePrimary([...previous, ...mapped]));
  };

  const mutation = useMutation({
    mutationFn: async (payload: { slug?: string; data: Record<string, unknown> }) => {
      const product = payload.slug
        ? await adminApi.updateProduct(payload.slug, payload.data)
        : await adminApi.saveProduct(payload.data);

      const productId = Number(product.id);
      const retained = activeImages;
      const deletions = images.filter((image) => image.deleted && image.existingId).map((image) => image.existingId as number);

      for (const imageId of deletions) {
        await adminApi.deleteProductImage(imageId);
      }

      for (let index = 0; index < retained.length; index += 1) {
        const item = retained[index];
        updateImage(item.localId, { status: 'uploading', progress: 1 });
        if (item.existingId && item.file) {
          await adminApi.replaceProductImage({
            imageId: item.existingId,
            file: item.file,
            altText: item.altText,
            isPrimary: item.isPrimary,
            sortOrder: index,
            onProgress: (percent) => updateImage(item.localId, { progress: percent }),
          });
        } else if (item.existingId) {
          await adminApi.replaceProductImage({
            imageId: item.existingId,
            altText: item.altText,
            isPrimary: item.isPrimary,
            sortOrder: index,
          });
        } else if (item.file) {
          await adminApi.uploadProductImage({
            productId,
            file: item.file,
            altText: item.altText,
            isPrimary: item.isPrimary,
            sortOrder: index,
            onProgress: (percent) => updateImage(item.localId, { progress: percent }),
          });
        }
        updateImage(item.localId, { status: 'success', progress: 100 });
      }

      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      notify(editingProduct ? 'Produto atualizado com imagens sincronizadas' : 'Produto cadastrado com sucesso');
      onCancelEdit?.();
    },
    onError: (error) => notify(error instanceof Error ? error.message : apiErrorMessage(error)),
  });

  const importByUrl = useMutation({
    mutationFn: async () => {
      if (!editingProduct?.id) throw new Error('Salve o produto antes de importar por link.');
      const urls = urlBatch.split('\n').map((item) => item.trim()).filter(Boolean);
      if (!urls.length) throw new Error('Cole ao menos uma URL de imagem.');
      const remaining = MAX_IMAGES - activeImages.length;
      if (remaining <= 0) throw new Error(`Limite de ${MAX_IMAGES} imagens por produto.`);
      const payloadUrls = urls.slice(0, remaining);
      return adminApi.importProductImagesByUrl({
        productId: editingProduct.id,
        urls: payloadUrls,
        altText: editingProduct.name,
        startSortOrder: activeImages.length,
        setFirstAsPrimary: !activeImages.some((image) => image.isPrimary),
      });
    },
    onSuccess: (result) => {
      const createdItems: ImageItem[] = (result.created ?? []).map((image) => ({
        localId: `existing-${image.id}`,
        existingId: image.id,
        previewUrl: image.image,
        altText: image.alt_text || editingProduct?.name || '',
        isPrimary: Boolean(image.is_primary),
        progress: 100,
        status: 'success',
      }));
      if (createdItems.length) {
        setImages((previous) => ensurePrimary([...previous, ...createdItems]));
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      }
      const successMessages = createdItems.map((item) => ({
        url: item.previewUrl,
        status: 'success' as const,
        message: 'Importada',
      }));
      const errorMessages = (result.errors ?? []).map((item) => ({
        url: item.url,
        status: 'error' as const,
        message: item.reason,
      }));
      setUrlImportStatus([...successMessages, ...errorMessages].slice(-8));
      if (createdItems.length) notify(`${createdItems.length} imagem(ns) importada(s) por link.`);
      if (errorMessages.length) notify(`${errorMessages.length} link(s) falharam na importacao.`);
      setUrlBatch('');
    },
    onError: (error) => notify(apiErrorMessage(error)),
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeImages.length < MIN_IMAGES) {
      notify(`Cadastre no minimo ${MIN_IMAGES} imagens para publicar.`);
      return;
    }
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name'));
    mutation.mutate({
      slug: editingProduct?.slug,
      data: {
        name,
        slug: editingProduct?.slug ?? slugify(name),
        sku: String(form.get('sku')),
        price: String(form.get('price')),
        promotional_price: String(form.get('promotional_price') || '') || null,
        category_id: Number(form.get('category_id')),
        brand_id: Number(form.get('brand_id')),
        description: String(form.get('description')),
        specifications: rowsToSpecifications(specRows),
        is_active: form.get('is_active') === 'on',
        is_featured: form.get('is_featured') === 'on',
        is_new: form.get('is_new') === 'on',
        is_best_seller: form.get('is_best_seller') === 'on',
        inventory: { quantity: Number(form.get('quantity')), low_stock_threshold: 5, reserved: 0 },
      },
    });
  };

  const isEditing = Boolean(editingProduct);

  return (
    <aside className={styles.editorDrawer} aria-label="Editor de produto">
      <form className={styles.productForm} onSubmit={onSubmit}>
        <div className={styles.drawerHeader}>
          <p>{isEditing ? 'Editar produto' : 'Novo produto'}</p>
          <h2>{isEditing ? editingProduct?.name : 'Cadastro de produto premium'}</h2>
          <span>{imageCount}/{MAX_IMAGES} imagens</span>
        </div>

        <div className={styles.formGrid}>
          <input name="name" defaultValue={editingProduct?.name ?? ''} placeholder="Nome comercial" required />
          <input name="sku" defaultValue={editingProduct?.sku ?? ''} placeholder="SKU" required />
          <input name="price" defaultValue={editingProduct?.price ?? ''} placeholder="Preco" required />
          <input name="promotional_price" defaultValue={editingProduct?.promotional_price ?? ''} placeholder="Preco promocional" />
          <input name="quantity" type="number" min={0} defaultValue={editingProduct?.inventory?.quantity ?? 0} placeholder="Estoque" required />
          <select name="category_id" defaultValue={editingProduct?.category?.id ? String(editingProduct.category.id) : ''} required>
            <option value="" disabled={Boolean(editingProduct?.category?.id)}>Selecione a categoria</option>
            {categories.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select name="brand_id" defaultValue={editingProduct?.brand?.id ? String(editingProduct.brand.id) : ''} required>
            <option value="" disabled={Boolean(editingProduct?.brand?.id)}>Selecione a marca</option>
            {brands.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <textarea name="description" defaultValue={editingProduct?.description ?? ''} placeholder="Descricao tecnica e diferenciais" required />
        </div>

        <div className={styles.specBlock}>
          <div className={styles.specHeader}>
            <div>
              <strong>Especificacoes tecnicas</strong>
              <p>Preencha em linhas simples. Isso aparece direto na pagina do produto.</p>
            </div>
            <button type="button" className={styles.secondarySubmit} onClick={addSuggestedSpecs}>Usar modelo</button>
          </div>
          <div className={styles.specRows}>
            {specRows.map((row) => (
              <div key={row.id} className={styles.specRow}>
                <input
                  value={row.key}
                  onChange={(event) => updateSpecRow(row.id, { key: event.currentTarget.value })}
                  placeholder="Campo: Tela, RAM, Garantia..."
                  aria-label="Nome da especificacao"
                />
                <input
                  value={row.value}
                  onChange={(event) => updateSpecRow(row.id, { value: event.currentTarget.value })}
                  placeholder="Valor: 27 pol QHD, 16 GB..."
                  aria-label="Valor da especificacao"
                />
                <button type="button" className={styles.specRemoveButton} onClick={() => removeSpecRow(row.id)} aria-label="Remover especificacao">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className={styles.specAddButton} onClick={() => addSpecRow()}>
            <Plus className="h-4 w-4" /> Adicionar especificacao
          </button>
        </div>

        <div className={styles.imageUploadBlock}>
          <div className={styles.uploadHeader}>
            <div>
              <strong>Galeria do produto</strong>
              <p>Obrigatorio: entre {MIN_IMAGES} e {MAX_IMAGES} imagens (JPG, PNG, WEBP ate {MAX_FILE_SIZE_MB}MB).</p>
            </div>
            <label className={styles.manualUpload}>
              <ImagePlus className="h-4 w-4" /> Selecionar imagens
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => addFiles(event.currentTarget.files)} />
            </label>
          </div>

          <div
            className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              addFiles(event.dataTransfer.files);
            }}
          >
            <UploadCloud className="h-5 w-5" /> Arraste arquivos aqui ou use selecionar imagens
          </div>

          <div className={styles.urlImportBlock}>
            <div className={styles.urlImportHeader}>
              <strong>Importar por link</strong>
              <span>1 URL por linha</span>
            </div>
            <textarea
              value={urlBatch}
              onChange={(event) => setUrlBatch(event.currentTarget.value)}
              placeholder="https://fabricante.com/imagem-1.jpg&#10;https://fabricante.com/imagem-2.webp"
              className={styles.urlImportTextarea}
              disabled={!isEditing || importByUrl.isPending}
            />
            <div className={styles.urlImportActions}>
              <button
                type="button"
                className={styles.secondarySubmit}
                onClick={() => importByUrl.mutate()}
                disabled={!isEditing || importByUrl.isPending}
              >
                {importByUrl.isPending ? <LoaderCircle className={`${styles.spin} h-4 w-4`} /> : null}
                {importByUrl.isPending ? 'Importando...' : 'Importar links'}
              </button>
              {!isEditing ? <p>Salve o produto primeiro para importar imagens por URL.</p> : null}
            </div>
            {urlImportStatus.length ? (
              <ul className={styles.urlImportResultList}>
                {urlImportStatus.map((item, index) => (
                  <li key={`${item.url}-${index}`} className={item.status === 'success' ? styles.urlImportOk : styles.urlImportError}>
                    <span>{item.status === 'success' ? 'OK' : 'ERRO'}</span> {item.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <ul className={styles.previewGrid}>
            {isEditingLoading ? (
              <li className={styles.previewCard}>
                <p className={styles.progressLabel}>Carregando imagens do produto...</p>
              </li>
            ) : null}
            {!isEditingLoading && !activeImages.length ? (
              <li className={styles.previewCard}>
                <p className={styles.progressLabel}>Este produto ainda nao possui imagens. Adicione por upload ou link.</p>
              </li>
            ) : null}
            {activeImages.map((image, index) => (
              <li
                key={image.localId}
                className={styles.previewCard}
                draggable
                onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const from = Number(event.dataTransfer.getData('text/plain'));
                  reorder(from, index);
                }}
              >
                <button type="button" className={styles.dragHandle} aria-label="Reordenar imagem"><GripVertical className="h-4 w-4" /></button>
                <img src={image.previewUrl} alt={image.altText || 'Preview'} />
                <div className={styles.previewMeta}>
                  <button type="button" onClick={() => setPrimary(image.localId)} className={image.isPrimary ? styles.primaryActive : styles.primaryButton}>
                    <Star className="h-3.5 w-3.5" /> {image.isPrimary ? 'Capa principal' : 'Definir como capa'}
                  </button>
                  <button type="button" onClick={() => removeImage(image.localId)} className={styles.removeButton}><Trash2 className="h-3.5 w-3.5" /> Remover</button>
                </div>
                <input
                  value={image.altText}
                  onChange={(event) => updateImage(image.localId, { altText: event.currentTarget.value })}
                  placeholder="Texto alternativo"
                  aria-label="Texto alternativo da imagem"
                />
                <div className={styles.progressTrack}>
                  <div style={{ width: `${image.progress}%` }} />
                </div>
                <p className={styles.progressLabel}>
                  {image.status === 'uploading' ? 'Enviando...' : image.status === 'error' ? 'Erro no upload' : image.status === 'success' ? 'Pronta' : 'Aguardando envio'}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.checkRow}>
          <label><input name="is_active" type="checkbox" defaultChecked={editingProduct?.is_active ?? true} /> Ativo para venda</label>
          <label><input name="is_featured" type="checkbox" defaultChecked={editingProduct?.is_featured ?? false} /> Destaque</label>
          <label><input name="is_new" type="checkbox" defaultChecked={editingProduct?.is_new ?? false} /> Lancamento</label>
          <label><input name="is_best_seller" type="checkbox" defaultChecked={editingProduct?.is_best_seller ?? false} /> Mais vendido</label>
        </div>

        <div className={styles.formActions}>
          <button disabled={mutation.isPending} className={styles.primarySubmit}>
            {mutation.isPending ? <LoaderCircle className={`${styles.spin} h-4 w-4`} /> : null}
            {mutation.isPending ? 'Salvando...' : isEditing ? 'Atualizar produto' : 'Salvar produto'}
          </button>
          {isEditing ? (
            <button type="button" onClick={onCancelEdit} className={styles.secondarySubmit}><X className="h-4 w-4" /> Fechar edicao</button>
          ) : null}
        </div>
      </form>
    </aside>
  );
}

export function CouponForm() {
  const { notify } = useToast();
  const mutation = useMutation({
    mutationFn: adminApi.saveCoupon,
    onSuccess: () => notify('Cupom salvo'),
    onError: (error) => notify(apiErrorMessage(error)),
  });
  return (
    <form className="surface grid gap-3 rounded-lg p-5 md:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      mutation.mutate({
        code: String(form.get('code')).toUpperCase(),
        value: String(form.get('value')),
        valid_from: String(form.get('valid_from')),
        valid_until: String(form.get('valid_until')),
        usage_limit: Number(form.get('usage_limit') || 0),
        used_count: 0,
        discount_type: String(form.get('discount_type')),
        is_active: form.get('is_active') === 'on',
      });
    }}>
      <input name="code" placeholder="Codigo" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="value" placeholder="Valor" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="valid_from" type="datetime-local" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="valid_until" type="datetime-local" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="usage_limit" type="number" placeholder="Limite de uso" className="min-h-11 rounded-lg border border-ink/10 px-3" />
      <select name="discount_type" className="min-h-11 rounded-lg border border-ink/10 px-3"><option value="percent">Percentual</option><option value="fixed">Valor fixo</option></select>
      <label className="flex items-center gap-2"><input name="is_active" type="checkbox" defaultChecked /> Ativo</label>
      <button disabled={mutation.isPending} className="min-h-11 rounded-lg bg-ink px-4 font-bold text-white md:col-span-2">Salvar cupom</button>
    </form>
  );
}

export function PromotionForm() {
  const { notify } = useToast();
  const mutation = useMutation({
    mutationFn: adminApi.savePromotion,
    onSuccess: () => notify('Promocao salva'),
    onError: (error) => notify(apiErrorMessage(error)),
  });
  return (
    <form className="surface grid gap-3 rounded-lg p-5 md:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      mutation.mutate({
        name: String(form.get('name')),
        old_price: String(form.get('old_price') || '') || null,
        promotional_price: String(form.get('promotional_price')),
        starts_at: String(form.get('starts_at')),
        ends_at: String(form.get('ends_at')),
        badge: String(form.get('badge') || 'Oferta'),
        is_active: form.get('is_active') === 'on',
        is_featured: form.get('is_featured') === 'on',
        products: [],
      });
    }}>
      <input name="name" placeholder="Campanha" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="old_price" placeholder="Preco antigo" className="min-h-11 rounded-lg border border-ink/10 px-3" />
      <input name="promotional_price" placeholder="Preco promocional" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="starts_at" type="datetime-local" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="ends_at" type="datetime-local" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="badge" placeholder="Selo" className="min-h-11 rounded-lg border border-ink/10 px-3" />
      <label className="flex items-center gap-2"><input name="is_active" type="checkbox" defaultChecked /> Ativa na loja</label>
      <label className="flex items-center gap-2"><input name="is_featured" type="checkbox" /> Destaque</label>
      <button disabled={mutation.isPending} className="min-h-11 rounded-lg bg-ink px-4 font-bold text-white md:col-span-2">Salvar promocao</button>
    </form>
  );
}
