"use server";

import { revalidatePath } from "next/cache";
import {
  notifyLowStockTransition,
  sendLowStockSummary,
} from "@/app/actions/notifications";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import {
  getServerSupabase,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

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

export interface AdminNotificationRecipient {
  id: string;
  email: string;
}

export interface AdminRecipientsResult {
  success: boolean;
  recipients: AdminNotificationRecipient[];
  error?: string;
}

function guardAdminDatabase(): ActionResult | null {
  if (!isSupabaseAdminConfigured) {
    return {
      success: false,
      error: "Recipient settings need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY configured.",
    };
  }
  return null;
}

export async function listAdminNotificationRecipients(): Promise<AdminRecipientsResult> {
  const guard = guardAdminDatabase();
  if (guard) return { ...guard, recipients: [] };

  const { data, error } = await getServerSupabase()
    .from("admin_notification_recipients")
    .select("id, email")
    .order("email", { ascending: true });

  if (error) {
    return {
      success: false,
      recipients: [],
      error: error.message.includes("admin_notification_recipients")
        ? "Run sql/admin-notification-recipients.sql in Supabase to enable recipient settings."
        : error.message,
    };
  }

  return { success: true, recipients: data ?? [] };
}

export async function addAdminNotificationRecipient(emailInput: string): Promise<ActionResult> {
  const guard = guardAdminDatabase();
  if (guard) return guard;

  const email = emailInput.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Enter a valid email address." };
  }

  const { error } = await getServerSupabase()
    .from("admin_notification_recipients")
    .insert({ email });

  if (error) {
    return {
      success: false,
      error: error.code === "23505" ? "That email is already on the alert list." : error.message,
    };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function removeAdminNotificationRecipient(id: string): Promise<ActionResult> {
  const guard = guardAdminDatabase();
  if (guard) return guard;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { success: false, error: "Invalid recipient." };
  }

  const { error } = await getServerSupabase()
    .from("admin_notification_recipients")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function sendCurrentLowStockSummary(): Promise<ActionResult & { count?: number }> {
  let products: Array<{
    name: string;
    stock_quantity: number;
    low_stock_threshold: number;
  }>;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await getServerSupabase()
        .from("products")
        .select("name, stock_quantity, low_stock_threshold");

      if (error) return { success: false, error: `Couldn't load products: ${error.message}` };
      products = data ?? [];
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Couldn't load products from Supabase.",
      };
    }
  } else {
    products = MOCK_PRODUCTS;
  }

  const lowStockProducts = products
    .filter((product) => product.stock_quantity <= product.low_stock_threshold)
    .map((product) => ({
      productName: product.name,
      currentStock: product.stock_quantity,
      threshold: product.low_stock_threshold,
    }));

  const result = await sendLowStockSummary(lowStockProducts);
  if (!result.success) return { success: false, error: result.error };

  return { success: true, count: lowStockProducts.length };
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
  const { data: created, error } = await supabase.from("products").insert({
    name: input.name,
    description: input.description || null,
    price: input.price,
    category: input.category,
    image_url: input.image_url || null,
    stock_quantity: input.stock_quantity,
    low_stock_threshold: input.low_stock_threshold,
  }).select("name, stock_quantity, low_stock_threshold").single();

  if (error) return { success: false, error: error.message };

  await notifyLowStockTransition({
    productName: created.name,
    previousStock: null,
    previousThreshold: null,
    currentStock: created.stock_quantity,
    currentThreshold: created.low_stock_threshold,
  });

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
  const { data: previous, error: previousError } = await supabase
    .from("products")
    .select("name, stock_quantity, low_stock_threshold")
    .eq("id", id)
    .single();

  if (previousError || !previous) {
    return { success: false, error: previousError?.message ?? "Product not found." };
  }

  const { data: updated, error } = await supabase
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
    .eq("id", id)
    .select("name, stock_quantity, low_stock_threshold")
    .single();

  if (error) return { success: false, error: error.message };

  await notifyLowStockTransition({
    productName: updated.name,
    previousStock: previous.stock_quantity,
    previousThreshold: previous.low_stock_threshold,
    currentStock: updated.stock_quantity,
    currentThreshold: updated.low_stock_threshold,
  });

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
  const { data: previous, error: previousError } = await supabase
    .from("products")
    .select("name, stock_quantity, low_stock_threshold")
    .eq("id", id)
    .single();

  if (previousError || !previous) {
    return { success: false, error: previousError?.message ?? "Product not found." };
  }

  const { data: updated, error } = await supabase
    .from("products")
    .update({ stock_quantity: stockQuantity })
    .eq("id", id)
    .select("name, stock_quantity, low_stock_threshold")
    .single();

  if (error) return { success: false, error: error.message };

  await notifyLowStockTransition({
    productName: updated.name,
    previousStock: previous.stock_quantity,
    previousThreshold: previous.low_stock_threshold,
    currentStock: updated.stock_quantity,
    currentThreshold: updated.low_stock_threshold,
  });

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
