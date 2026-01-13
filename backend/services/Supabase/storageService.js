import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

class StorageService {
  constructor() {
    this.bucketName = "restaurant-assets"; // Tên bucket trong Supabase
  }

  /**
   * Upload single image file
   */
  async uploadImage(
    file,
    tenantId,
    subFolder = "general",
    customFileName = null
  ) {
    try {
      // Tạo filename duy nhất
      const fileExtension = file.originalname.split(".").pop();
      const fileName = customFileName
        ? `${customFileName}.${fileExtension}`
        : `${uuidv4()}.${fileExtension}`;

      // Đường dẫn trong bucket: tenantId/subFolder/fileName
      const filePath = `${tenantId}/${subFolder}/${fileName}`;

      // Upload lên Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return {
        fileName: fileName,
        filePath: filePath,
        url: urlData.publicUrl,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      throw new Error(`Storage upload error: ${error.message}`);
    }
  }

  /**
   * Upload from URL (download từ URL khác rồi upload lên Supabase)
   */
  async uploadFromUrl(
    imageUrl,
    tenantId,
    subFolder = "general",
    customFileName = null
  ) {
    try {
      // Download image từ URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const imageBuffer = await response.buffer();
      const contentType = response.headers.get("content-type") || "image/jpeg";

      // Guess file extension from content type
      const extension = contentType.split("/")[1] || "jpg";

      // Tạo filename
      const fileName = customFileName
        ? `${customFileName}.${extension}`
        : `${uuidv4()}.${extension}`;

      const filePath = `${tenantId}/${subFolder}/${fileName}`;

      // Upload lên Supabase
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, imageBuffer, {
          contentType: contentType,
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return {
        fileName: fileName,
        filePath: filePath,
        url: urlData.publicUrl,
        size: imageBuffer.length,
        mimeType: contentType,
        originalUrl: imageUrl,
      };
    } catch (error) {
      throw new Error(`URL upload error: ${error.message}`);
    }
  }

  /**
   * Upload batch (nhiều file + URLs)
   */
  async uploadBatch(
    files = [],
    imageUrls = [],
    tenantId,
    subFolder = "general"
  ) {
    const results = {
      success: [],
      failed: [],
    };

    // Upload files
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const result = await this.uploadImage(file, tenantId, subFolder);
          results.success.push({
            type: "file",
            originalName: file.originalname,
            result: result,
          });
        } catch (error) {
          results.failed.push({
            type: "file",
            originalName: file.originalname,
            error: error.message,
          });
        }
      }
    }

    // Upload từ URLs
    if (imageUrls && imageUrls.length > 0) {
      for (const url of imageUrls) {
        try {
          const result = await this.uploadFromUrl(url, tenantId, subFolder);
          results.success.push({
            type: "url",
            originalUrl: url,
            result: result,
          });
        } catch (error) {
          results.failed.push({
            type: "url",
            originalUrl: url,
            error: error.message,
          });
        }
      }
    }

    return results;
  }

  /**
   * List all files trong bucket của tenant
   */
  async listFiles(tenantId, subFolder = "") {
    try {
      const folderPath = subFolder ? `${tenantId}/${subFolder}` : `${tenantId}`;

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(folderPath);

      if (error) {
        throw new Error(`List files failed: ${error.message}`);
      }

      // Transform và add public URLs
      const filesWithUrls = data.map((file) => {
        const fullPath = `${folderPath}/${file.name}`;
        const { data: urlData } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(fullPath);

        return {
          name: file.name,
          path: fullPath,
          url: urlData.publicUrl,
          size: file.metadata?.size || 0,
          lastModified: file.updated_at,
          mimeType: file.metadata?.mimetype || "",
        };
      });

      return filesWithUrls;
    } catch (error) {
      throw new Error(`List files error: ${error.message}`);
    }
  }

  /**
   * Delete file by URL
   */
  async deleteByUrl(publicUrl) {
    try {
      // Extract file path từ public URL
      // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file.jpg
      const urlParts = publicUrl.split("/");
      const bucketIndex = urlParts.findIndex(
        (part) => part === this.bucketName
      );

      if (bucketIndex === -1) {
        throw new Error("Invalid URL or bucket name not found");
      }

      // Lấy path sau bucket name
      const filePath = urlParts.slice(bucketIndex + 1).join("/");

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      return {
        message: "File deleted successfully",
        deletedPath: filePath,
      };
    } catch (error) {
      throw new Error(`Delete error: ${error.message}`);
    }
  }

  /**
   * Delete file by path
   */
  async deleteByPath(filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      return {
        message: "File deleted successfully",
        deletedPath: filePath,
      };
    } catch (error) {
      throw new Error(`Delete error: ${error.message}`);
    }
  }
}

export default new StorageService();
