"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock_quantity: number;
  low_stock_threshold: number;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

function guardConfigured(): ActionResult | null {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error:
        "Supabase isn't configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.",
    };
  }
  return null;
}

export async function createProduct(input: ProductInput): Promise<ActionResult> {
  const guard = guardConfigured();
  if (guard) return guard;

  const supabase = getServerSupabase();
  const { error } = await supabase.from("products").insert({
    name: input.name,
    description: input.description || null,
    price: input.price,
    category: input.category,
    image_url: input.image_url || null,
    stock_quantity: input.stock_quantity,
    low_stock_threshold: input.low_stock_threshold,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<ActionResult> {
  const guard = guardConfigured();
  if (guard) return guard;

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      description: input.description || null,
      price: input.price,
      category: input.category,
      image_url: input.image_url || null,
      stock_quantity: input.stock_quantity,
      low_stock_threshold: input.low_stock_threshold,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function updateStockQuantity(
  id: string,
  stockQuantity: number
): Promise<ActionResult> {
  const guard = guardConfigured();
  if (guard) return guard;

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("products")
    .update({ stock_quantity: stockQuantity })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const guard = guardConfigured();
  if (guard) return guard;

  const supabase = getServerSupabase();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function uploadProductImage(file: ArrayBuffer, filename: string): Promise<{ success: boolean; url?: string; error?: string }> {
  const guard = guardConfigured();
  if (guard) return guard;

  const supabase = getServerSupabase();
  const fileExt = filename.split(".").pop()?.toLowerCase() || "jpg";
  const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const filePath = `${fileId}.${fileExt}`;

  const { error } = await supabase.storage.from("products").upload(filePath, file, {
    contentType: `image/${fileExt}`,
  });

  if (error) return { success: false, error: error.message };

  const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl(filePath);

  return {
    success: true,
    url: publicUrlData.publicUrl,
  };
}

export async function getCategories(): Promise<{ success: boolean; categories?: string[]; error?: string }> {
  const guard = guardConfigured();
  if (guard) return guard;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .not("category", "is", null);

  if (error) return { success: false, error: error.message };

  // Get unique categories and sort them
  const categories = Array.from(new Set(data.map(p => p.category))).sort();

  return {
    success: true,
    categories,
  };
}
