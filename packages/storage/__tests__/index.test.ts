/**
 * @jest-environment node
 */

import { Storage, StorageItem } from "../src/index";

describe("Storage Package", () => {
  let st: Storage;

  beforeEach(() => {
    st = new Storage();
  });

  afterEach(async () => {
    await st.cleanup();
  });

  describe("initialize", () => {
    it("should initialize the storage", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await st.initialize();

      expect(consoleSpy).toHaveBeenCalledWith("Storage initialized with local provider");
      consoleSpy.mockRestore();
    });
  });

  describe("execute", () => {
    it("should execute upload action", async () => {
      await st.initialize();

      const result = await st.execute({
        action: "upload",
        data: { name: "test.txt", size: 100, type: "text/plain" },
      });

      expect(result.name).toBe("test.txt");
      expect(result.size).toBe(100);
    });

    it("should execute download action", async () => {
      await st.initialize();

      // First upload
      const uploaded = await st.execute({
        action: "upload",
        data: { name: "test.txt" },
      });

      // Then download
      const result = await st.execute({
        action: "download",
        data: { id: uploaded.id },
      });

      expect(result.name).toBe("test.txt");
    });

    it("should execute delete action", async () => {
      await st.initialize();

      // First upload
      const uploaded = await st.execute({
        action: "upload",
        data: { name: "test.txt" },
      });

      // Then delete - need to cast since delete returns boolean
      const result = (await st.execute({
        action: "delete",
        data: { id: uploaded.id },
      })) as unknown as boolean;

      expect(result).toBe(true);
    });

    it("should execute list action", async () => {
      await st.initialize();

      // Upload some items with delays to ensure unique IDs
      await st.execute({
        action: "upload",
        data: { name: "file1.txt" },
      });
      await new Promise((resolve) => setTimeout(resolve, 5));
      await st.execute({
        action: "upload",
        data: { name: "file2.txt" },
      });

      // List returns an array - cast appropriately
      const result = (await st.execute({
        action: "list",
        data: {},
      })) as unknown as StorageItem[];

      expect(result.length).toBe(2);
    });

    it("should throw error for unknown action", async () => {
      await st.initialize();

      await expect(st.execute({ action: "unknown", data: {} })).rejects.toThrow(
        "Unknown storage action: unknown"
      );
    });
  });

  describe("upload", () => {
    it("should upload a file", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      await st.initialize();

      const result = await st.execute({
        action: "upload",
        data: { name: "document.pdf", size: 1024, type: "application/pdf" },
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe("document.pdf");
      expect(result.size).toBe(1024);
      expect(result.type).toBe("application/pdf");
      expect(result.url).toBe("storage://document.pdf");
      expect(consoleSpy).toHaveBeenCalledWith("File uploaded: document.pdf");
      consoleSpy.mockRestore();
    });

    it("should default size to 0 when not provided", async () => {
      await st.initialize();

      const result = await st.execute({
        action: "upload",
        data: { name: "test.txt" },
      });

      expect(result.size).toBe(0);
    });

    it("should default type to unknown when not provided", async () => {
      await st.initialize();

      const result = await st.execute({
        action: "upload",
        data: { name: "test.txt" },
      });

      expect(result.type).toBe("unknown");
    });

    it("should store metadata when provided", async () => {
      await st.initialize();

      const result = await st.execute({
        action: "upload",
        data: {
          name: "test.txt",
          metadata: { uploadedBy: "user-1", version: "1.0" },
        },
      });

      expect(result.metadata).toEqual({ uploadedBy: "user-1", version: "1.0" });
    });

    it("should generate unique IDs", async () => {
      await st.initialize();

      const result1 = await st.execute({
        action: "upload",
        data: { name: "test.txt" },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const result2 = await st.execute({
        action: "upload",
        data: { name: "test.txt" },
      });

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe("download", () => {
    it("should download an uploaded file", async () => {
      await st.initialize();

      const uploaded = await st.execute({
        action: "upload",
        data: { name: "test.txt", size: 500 },
      });

      const result = await st.execute({
        action: "download",
        data: { id: uploaded.id },
      });

      expect(result.id).toBe(uploaded.id);
      expect(result.name).toBe("test.txt");
      expect(result.size).toBe(500);
    });

    it("should throw error for non-existent file", async () => {
      await st.initialize();

      await expect(
        st.execute({
          action: "download",
          data: { id: "non-existent-id" },
        })
      ).rejects.toThrow("Item not found: non-existent-id");
    });
  });

  describe("delete", () => {
    it("should delete an existing file", async () => {
      await st.initialize();

      const uploaded = await st.execute({
        action: "upload",
        data: { name: "test.txt" },
      });

      const result = (await st.execute({
        action: "delete",
        data: { id: uploaded.id },
      })) as unknown as boolean;

      expect(result).toBe(true);
    });

    it("should return false for non-existent file", async () => {
      await st.initialize();

      const result = (await st.execute({
        action: "delete",
        data: { id: "non-existent-id" },
      })) as unknown as boolean;

      expect(result).toBe(false);
    });
  });

  describe("list", () => {
    it("should list all files", async () => {
      await st.initialize();

      // Upload files with delays to ensure unique IDs
      await st.execute({
        action: "upload",
        data: { name: "file1.txt" },
      });
      await new Promise((resolve) => setTimeout(resolve, 5));
      await st.execute({
        action: "upload",
        data: { name: "file2.txt" },
      });
      await new Promise((resolve) => setTimeout(resolve, 5));
      await st.execute({
        action: "upload",
        data: { name: "file3.txt" },
      });

      const result = (await st.execute({
        action: "list",
        data: {},
      })) as unknown as StorageItem[];

      expect(result.length).toBe(3);
    });

    it("should return empty array when no files", async () => {
      await st.initialize();

      const result = (await st.execute({
        action: "list",
        data: {},
      })) as unknown as StorageItem[];

      expect(result).toEqual([]);
    });
  });

  describe("cleanup", () => {
    it("should clear all items", async () => {
      await st.initialize();

      await st.execute({
        action: "upload",
        data: { name: "test.txt" },
      });

      await st.cleanup();

      // After cleanup, list should be empty
      const result = (await st.execute({
        action: "list",
        data: {},
      })) as unknown as StorageItem[];

      expect(result).toEqual([]);
    });

    it("should log cleanup message", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await st.cleanup();

      expect(consoleSpy).toHaveBeenCalledWith("Storage cleaned up");
      consoleSpy.mockRestore();
    });
  });

  describe("default export", () => {
    it("should export a default Storage instance", () => {
      const { storage } = require("../src/index");
      expect(storage).toBeInstanceOf(Storage);
    });
  });
});
