import institution from "../../operation/data.json";
import { uploadData } from "@aws-amplify/storage";

export const uploadFileToS3 = async (
  file,
  folderName = "salon-assets",
  bucketName = "institution-utils",
  region = "us-east-1"
) => {
  try {
    const instId = institution.institutionId || institution.institutionid || "tekkzysalon";
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const uniqueFileName = `${instId}/${folderName}/${Date.now()}-${sanitizedFileName}`;

    console.log("Starting S3 upload:", uniqueFileName);

    const result = await uploadData({
      path: uniqueFileName,
      data: file,
      options: {
        bucket: {
          bucketName: bucketName,
          region: region,
        },
        contentType: file.type || "image/png",
        onProgress: ({ transferredBytes, totalBytes }) => {
          if (totalBytes) {
            console.log(
              `Upload progress: ${Math.round(
                (transferredBytes / totalBytes) * 100
              )}%`
            );
          }
        },
      },
    }).result;

    const encodedPath = result.path.split("/").map(encodeURIComponent).join("/");
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${encodedPath}`;
    console.log("File uploaded successfully:", result, url);

    return {
      filename: file.name,
      url,
    };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    // In local dev without AWS credentials, provide optimized data URL fallback to avoid DynamoDB 400KB limit
    if (import.meta.env.DEV) {
      console.warn("Dev mode fallback: optimizing image preview to stay well under DynamoDB size limit");
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const raw = e.target?.result;
          if (typeof raw === "string" && raw.startsWith("data:image/")) {
            const img = new Image();
            img.onload = () => {
              const maxDim = 200;
              let w = img.width;
              let h = img.height;
              if (w > maxDim || h > maxDim) {
                if (w > h) {
                  h = Math.round((h * maxDim) / w);
                  w = maxDim;
                } else {
                  w = Math.round((w * maxDim) / h);
                  h = maxDim;
                }
              }
              const canvas = document.createElement("canvas");
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, w, h);
              resolve({
                filename: file.name,
                url: canvas.toDataURL("image/jpeg", 0.7),
              });
            };
            img.onerror = () => resolve({ filename: file.name, url: raw });
            img.src = raw;
          } else {
            resolve({ filename: file.name, url: raw });
          }
        };
        reader.readAsDataURL(file);
      });
    }
    throw error;
  }
};
