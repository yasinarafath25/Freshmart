"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { saveProductAction, uploadImageAction, type AdminState } from "@/app/admin/actions";
import { Alert, Button, ButtonLink, Card, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { keepValues } from "@/lib/utils/form";

type V = { id?: string; name: string; sku: string; price: string; compareAtPrice: string; stock: string; isDefault: boolean };
export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string | null;
  unit: string;
  origin: string;
  freshnessLabel: string;
  images: string[];
  isOrganic: boolean;
  isFeatured: boolean;
  isSeasonal: boolean;
  isActive: boolean;
  variants: V[];
};

const UNITS = ["kg", "g", "piece", "dozen", "bunch", "pack", "litre", "ml"];

export function ProductForm({ initial, categories, currency }: { initial: ProductFormValues; categories: { id: string; name: string; parentId: string | null }[]; currency: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveProductAction, null);
  const [variants, setVariants] = useState<V[]>(initial.variants.length ? initial.variants : [{ name: "1 kg", sku: "", price: "", compareAtPrice: "", stock: "0", isDefault: true }]);
  const [images, setImages] = useState<string[]>(initial.images);
  const [uploading, startUpload] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const e = state?.errors ?? {};

  const setV = (i: number, patch: Partial<V>) => setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : patch.isDefault ? { ...v, isDefault: false } : v)));
  const payload = variants.map((v) => ({
    id: v.id ?? "",
    name: v.name,
    sku: v.sku,
    price: v.price === "" ? -1 : Number(v.price),
    compareAtPrice: v.compareAtPrice === "" ? "" : Number(v.compareAtPrice),
    stock: v.stock === "" ? 0 : Number(v.stock),
    isDefault: v.isDefault,
  }));

  return (
    <form action={action} onSubmit={keepValues(action)} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="variants" value={JSON.stringify(payload)} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <div className="space-y-6">
        {state?.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}
        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Basic information</h2>
          <Field label="Product name" htmlFor="name" error={e.name}><Input id="name" name="name" defaultValue={initial.name} required error={e.name} /></Field>
          <Field label="URL slug" htmlFor="slug" error={e.slug} hint="Leave empty to generate from the name."><Input id="slug" name="slug" defaultValue={initial.slug} error={e.slug} /></Field>
          <Field label="Description" htmlFor="description" error={e.description}><Textarea id="description" name="description" defaultValue={initial.description} className="min-h-32" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Origin" htmlFor="origin"><Input id="origin" name="origin" defaultValue={initial.origin} placeholder="e.g. Local farms" /></Field>
            <Field label="Freshness badge" htmlFor="freshnessLabel" hint="Shown on the card, e.g. Fresh, Organic, Seasonal"><Input id="freshnessLabel" name="freshnessLabel" defaultValue={initial.freshnessLabel} /></Field>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Variants, prices &amp; stock</h2>
            <Button type="button" variant="secondary" size="sm" onClick={() => setVariants((vs) => [...vs, { name: "", sku: "", price: "", compareAtPrice: "", stock: "0", isDefault: vs.length === 0 }])}>
              <Plus className="size-4" aria-hidden /> Add variant
            </Button>
          </div>
          <p className="text-xs text-ink-600">Prices in {currency}. “Compare at” shows a strike-through price and discount badge when higher than the price.</p>
          <div className="space-y-3">
            {variants.map((v, i) => (
              <fieldset key={i} className="grid grid-cols-2 gap-3 rounded-xl border border-line p-3 md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.6fr_auto]">
                <legend className="sr-only">Variant {i + 1}</legend>
                <Field label="Name" htmlFor={`vn-${i}`}><Input id={`vn-${i}`} value={v.name} onChange={(ev) => setV(i, { name: ev.target.value })} placeholder="1 kg" required /></Field>
                <Field label="SKU" htmlFor={`vs-${i}`}><Input id={`vs-${i}`} value={v.sku} onChange={(ev) => setV(i, { sku: ev.target.value.toUpperCase() })} required /></Field>
                <Field label="Price" htmlFor={`vp-${i}`}><Input id={`vp-${i}`} type="number" min={0} step="0.01" value={v.price} onChange={(ev) => setV(i, { price: ev.target.value })} required /></Field>
                <Field label="Compare at" htmlFor={`vc-${i}`}><Input id={`vc-${i}`} type="number" min={0} step="0.01" value={v.compareAtPrice} onChange={(ev) => setV(i, { compareAtPrice: ev.target.value })} /></Field>
                <Field label="Stock" htmlFor={`vk-${i}`}><Input id={`vk-${i}`} type="number" min={0} step="1" value={v.stock} onChange={(ev) => setV(i, { stock: ev.target.value })} /></Field>
                <div className="flex items-end gap-1 pb-0.5">
                  <button type="button" onClick={() => setV(i, { isDefault: true })} className={`grid size-11 place-items-center rounded-lg ${v.isDefault ? "text-sun-400" : "text-ink-400 hover:text-ink-900"}`} aria-label="Make default variant" aria-pressed={v.isDefault} title="Default variant">
                    <Star className={`size-5 ${v.isDefault ? "fill-sun-400" : ""}`} />
                  </button>
                  <button type="button" disabled={variants.length === 1} onClick={() => setVariants((vs) => { const n = vs.filter((_, j) => j !== i); if (!n.some((x) => x.isDefault) && n[0]) n[0] = { ...n[0], isDefault: true }; return n; })} className="grid size-11 place-items-center rounded-lg text-ink-400 hover:text-tomato-600 disabled:opacity-30" aria-label="Remove variant">
                    <Trash2 className="size-5" />
                  </button>
                </div>
              </fieldset>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Images</h2>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {images.map((src, i) => (
              <li key={src} className="group relative overflow-hidden rounded-xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="aspect-square w-full object-cover" />
                {i === 0 && <span className="absolute left-1 top-1 rounded bg-brand-700 px-1.5 text-[10px] font-semibold text-white">Main</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/90 p-1 text-xs">
                  {i > 0 ? <button type="button" className="font-semibold text-brand-700" onClick={() => setImages((im) => [src, ...im.filter((x) => x !== src)])}>Make main</button> : <span />}
                  <button type="button" className="font-semibold text-tomato-600" onClick={() => setImages((im) => im.filter((x) => x !== src))}>Remove</button>
                </div>
              </li>
            ))}
            {images.length < 8 && (
              <li>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="grid aspect-square w-full place-items-center rounded-xl border-2 border-dashed border-line text-ink-400 hover:border-brand-600 hover:text-brand-700">
                  {uploading ? <Loader2 className="size-6 animate-spin" /> : <span className="flex flex-col items-center gap-1 text-xs font-semibold"><ImagePlus className="size-6" />Upload</span>}
                </button>
              </li>
            )}
          </ul>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            aria-label="Upload product image"
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              ev.target.value = "";
              if (!f) return;
              setUploadError(null);
              startUpload(async () => {
                const fd = new FormData();
                fd.set("file", f);
                const res = await uploadImageAction(fd);
                if (res.url) setImages((im) => [...im, res.url!]);
                else setUploadError(res.error ?? "Upload failed.");
              });
            }}
          />
          {uploadError && <Alert tone="error">{uploadError}</Alert>}
          <div className="flex gap-2">
            <Input value={urlInput} onChange={(ev) => setUrlInput(ev.target.value)} placeholder="…or paste an https:// image URL" aria-label="Image URL" />
            <Button type="button" variant="secondary" onClick={() => { if (/^https:\/\/|^\/images\//.test(urlInput) && images.length < 8) { setImages((im) => [...im, urlInput]); setUrlInput(""); } }}>Add</Button>
          </div>
          <p className="text-xs text-ink-600">JPEG, PNG, WebP or AVIF up to 5 MB. Square photos (at least 800×800) look best.</p>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Organisation</h2>
          <Field label="Category" htmlFor="categoryId" error={e.categoryId}>
            <Select id="categoryId" name="categoryId" defaultValue={initial.categoryId ?? ""}>
              <option value="">— None —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.parentId ? "↳ " : ""}{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Selling unit" htmlFor="unit"><Select id="unit" name="unit" defaultValue={initial.unit}>{UNITS.map((u) => <option key={u}>{u}</option>)}</Select></Field>
          <div className="space-y-2.5 pt-2">
            <Checkbox name="isActive" label="Visible in store" defaultChecked={initial.isActive} />
            <Checkbox name="isFeatured" label="Featured on homepage" defaultChecked={initial.isFeatured} />
            <Checkbox name="isOrganic" label="Organic" defaultChecked={initial.isOrganic} />
            <Checkbox name="isSeasonal" label="Seasonal" defaultChecked={initial.isSeasonal} />
          </div>
        </Card>
        <div className="flex gap-3">
          <Button size="lg" className="flex-1" disabled={pending || uploading}>{pending ? "Saving…" : initial.id ? "Save changes" : "Create product"}</Button>
          <ButtonLink href="/admin/products" variant="secondary" size="lg">Cancel</ButtonLink>
        </div>
      </div>
    </form>
  );
}
