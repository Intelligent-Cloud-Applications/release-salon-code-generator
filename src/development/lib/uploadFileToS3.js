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
    // In local dev without AWS credentials, provide base64 data URL fallback so testing isn't blocked
    if (import.meta.env.DEV) {
      console.warn("Dev mode fallback: using data URL preview");
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            filename: file.name,
            url: reader.result,
          });
        };
        reader.readAsDataURL(file);
      });
    }
    throw error;
  }
};
