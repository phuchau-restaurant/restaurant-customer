const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

class UploadService {
  /**
   * Upload single image file
   */
  async uploadSingle(file, folder = "general", fileName = null) {
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", folder);

      if (fileName) {
        formData.append("fileName", fileName);
      }

      const response = await fetch(`${BASE_URL}/api/upload/single`, {
        method: "POST",
        headers: {
          "x-tenant-id": import.meta.env.VITE_TENANT_ID || "default-tenant",
        },
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Upload single error:", error);
      throw error;
    }
  }

  /**
   * Upload from URL
   */
  async uploadFromUrl(imageUrl, folder = "general", fileName = null) {
    try {
      const body = {
        imageUrl: imageUrl,
        folder: folder,
      };

      if (fileName) {
        body.fileName = fileName;
      }

      const response = await fetch(`${BASE_URL}/api/upload/single`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": import.meta.env.VITE_TENANT_ID || "default-tenant",
        },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload from URL failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Upload from URL error:", error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadBatch(files = [], imageUrls = [], folder = "general") {
    try {
      const formData = new FormData();

      // Add files
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append("images", file);
        });
      }

      // Add URLs as JSON string
      if (imageUrls && imageUrls.length > 0) {
        formData.append("imageUrls", JSON.stringify(imageUrls));
      }

      formData.append("folder", folder);

      const response = await fetch(`${BASE_URL}/api/upload/batch`, {
        method: "POST",
        headers: {
          "x-tenant-id": import.meta.env.VITE_TENANT_ID || "default-tenant",
        },
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Batch upload failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Upload batch error:", error);
      throw error;
    }
  }

  /**
   * Get list of uploaded files
   */
  async getFilesList(folder = "") {
    try {
      const url = folder
        ? `${BASE_URL}/api/upload/list?folder=${encodeURIComponent(folder)}`
        : `${BASE_URL}/api/upload/list`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-tenant-id": import.meta.env.VITE_TENANT_ID || "default-tenant",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Get files list failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Get files list error:", error);
      throw error;
    }
  }

  /**
   * Delete file by URL
   */
  async deleteFile(fileUrl) {
    try {
      const response = await fetch(`${BASE_URL}/api/upload/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": import.meta.env.VITE_TENANT_ID || "default-tenant",
        },
        body: JSON.stringify({ url: fileUrl }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Delete file failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Delete file error:", error);
      throw error;
    }
  }
}

export default new UploadService();
