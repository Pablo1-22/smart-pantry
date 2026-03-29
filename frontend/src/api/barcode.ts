import client from "./client";

export interface BarcodeResult {
  barcode: string;
  name: string | null;
  category: string | null;
  image_url: string | null;
  found: boolean;
}

export async function lookupBarcode(code: string): Promise<BarcodeResult> {
  const { data } = await client.get<BarcodeResult>(`/api/barcode/${code}`);
  return data;
}
