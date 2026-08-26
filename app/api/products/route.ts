import { getProducts } from "@/lib/data";

export async function GET() {
  try {
    const products = await getProducts();
    return Response.json(products);
  } catch (error) {
    console.error("API error:", error);
    return Response.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
