"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Upload, X, Check, ChevronsUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, updateProduct, uploadProductImage, getCategories, type ProductInput } from "@/app/admin/actions";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const emptyForm: ProductInput = {
  name: "",
  description: "",
  price: 0,
  category: "",
  image_url: "",
  stock_quantity: 0,
  low_stock_threshold: 5,
};

function getInitialForm(product?: Product | null): ProductInput {
  if (!product) return emptyForm;
  return {
    name: product.name,
    description: product.description ?? "",
    price: product.price,
    category: product.category,
    image_url: product.image_url ?? "",
    stock_quantity: product.stock_quantity,
    low_stock_threshold: product.low_stock_threshold,
  };
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: ProductFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {open && (
          <ProductForm
            key={product?.id ?? "new"}
            product={product}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProductForm({
  product,
  onOpenChange,
}: {
  product?: Product | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<ProductInput>(() => getInitialForm(product));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.image_url ?? null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isOpenCombobox, setIsOpenCombobox] = useState(false);
  const [categoryInput, setCategoryInput] = useState(form.category);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(product);

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      const result = await getCategories();
      if (result.success && result.categories) {
        setCategories(result.categories);
      }
    }
    loadCategories();
  }, []);

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(categoryInput.toLowerCase())
  );

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    setIsUploadingImage(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await uploadProductImage(arrayBuffer, file.name);

      if (result.success && result.url) {
        setForm({ ...form, image_url: result.url });
        toast.success("Image uploaded successfully");
      } else {
        toast.error(result.error ?? "Failed to upload image");
        setPreviewUrl(form.image_url || null);
      }
    } catch {
      toast.error("Failed to upload image");
      setPreviewUrl(form.image_url || null);
    } finally {
      setIsUploadingImage(false);
    }
  }

  function handleRemoveImage() {
    setForm({ ...form, image_url: "" });
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleCategorySelect(category: string) {
    setForm({ ...form, category });
    setCategoryInput(category);
    setIsOpenCombobox(false);
  }

  function handleCategoryInputChange(value: string) {
    setCategoryInput(value);
    setForm({ ...form, category: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const result = isEditing && product
      ? await updateProduct(product.id, form)
      : await createProduct(form);

    setIsSubmitting(false);

    if (result.success) {
      toast.success(isEditing ? "Product updated" : "Product created");
      onOpenChange(false);
    } else {
      toast.error(result.error ?? "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit product" : "Add product"}</DialogTitle>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="price">Price (K)</Label>
          <Input
            id="price"
            type="text"
            inputMode="decimal"
            required
            value={form.price === 0 ? "" : form.price}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setForm({ ...form, price: 0 });
              } else {
                const num = parseFloat(value);
                if (!isNaN(num)) {
                  setForm({ ...form, price: num });
                }
              }
            }}
            placeholder="0.00"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpenCombobox(!isOpenCombobox)}
              className={cn(
                "w-full h-10 px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-black flex items-center justify-between",
                isOpenCombobox && "ring-1 ring-offset-0 ring-black"
              )}
            >
              <span className={categoryInput ? "text-black" : "text-gray-500"}>
                {categoryInput || "Select category..."}
              </span>
              <ChevronsUpDown className="w-4 h-4 text-gray-400" />
            </button>

            {isOpenCombobox && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Search or type..."
                    value={categoryInput}
                    onChange={(e) => handleCategoryInputChange(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategorySelect(cat)}
                        className={cn(
                          "w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between text-sm",
                          form.category === cat && "bg-gray-100"
                        )}
                      >
                        {cat}
                        {form.category === cat && <Check className="w-4 h-4" />}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No categories found. Press Enter to create &quot;{categoryInput}&quot;
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="image_url">Product Image</Label>
        <div className="space-y-3">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="image_file"
              className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 p-6"
            >
              <div className="flex flex-col items-center justify-center pt-2 pb-2">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
              </div>
              <input
                id="image_file"
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isUploadingImage}
              />
            </label>
          </div>

          {previewUrl && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <img
                src={previewUrl}
                alt="Product preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={isUploadingImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
              {isUploadingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <p className="text-white text-sm">Uploading...</p>
                </div>
              )}
            </div>
          )}

          {!previewUrl && (
            <p className="text-xs text-gray-500">
              {isUploadingImage ? "Uploading image..." : "No image selected"}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="stock_quantity">Stock quantity</Label>
          <Input
            id="stock_quantity"
            type="text"
            inputMode="numeric"
            value={form.stock_quantity === 0 ? "" : form.stock_quantity}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setForm({ ...form, stock_quantity: 0 });
              } else {
                const num = parseInt(value, 10);
                if (!isNaN(num) && num >= 0) {
                  setForm({ ...form, stock_quantity: num });
                }
              }
            }}
            placeholder="0"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="low_stock_threshold">Low stock threshold</Label>
          <Input
            id="low_stock_threshold"
            type="text"
            inputMode="numeric"
            value={form.low_stock_threshold === 0 ? "" : form.low_stock_threshold}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setForm({ ...form, low_stock_threshold: 0 });
              } else {
                const num = parseInt(value, 10);
                if (!isNaN(num) && num >= 0) {
                  setForm({ ...form, low_stock_threshold: num });
                }
              }
            }}
            placeholder="5"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting || isUploadingImage || !form.image_url}>
          {isSubmitting ? "Saving..." : "Save product"}
        </Button>
      </DialogFooter>
    </form>
  );
}
