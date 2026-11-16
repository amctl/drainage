import { Buffer } from "node:buffer";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const image = formData?.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return Response.json(
      { success: false, message: "No image uploaded." },
      { status: 400 }
    );
  }

  // Convert the uploaded file into a buffer for the real EXIF/hash pipeline.
  const buffer = Buffer.from(await image.arrayBuffer());

  if (buffer.length === 0) {
    return Response.json(
      { success: false, message: "No image uploaded." },
      { status: 400 }
    );
  }

  // Simulate the time taken by EXIF extraction and the pHash lookup.
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Mock EXIF check. Replace with a real EXIF parser later.
  const hasGPS = true;

  // Mock perceptual-hash duplicate check. Replace with a real pHash + lookup.
  const isDuplicate = false;

  if (!hasGPS) {
    return Response.json(
      { success: false, message: "GPS data missing. Please enable location." },
      { status: 400 }
    );
  }

  if (isDuplicate) {
    return Response.json(
      { success: false, message: "Image already reported." },
      { status: 400 }
    );
  }

  return Response.json({
    success: true,
    message: "Verified successfully!",
  });
}
