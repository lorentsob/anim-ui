import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  AppError,
  errorManager,
  createAnimationError,
  createExportError,
  createStorageError,
  withRetry,
  safeSyncOperation,
} from "@/lib/errorHandling";

describe("Error Handling System", () => {
  beforeEach(() => {
    errorManager.clearErrorLog();
  });

  describe("AppError", () => {
    it("should create an error with proper categorization", () => {
      const error = new AppError("Test error", {
        category: "animation",
        severity: "high",
        operation: "test-operation",
        metadata: { test: true },
      });

      expect(error.category).toBe("animation");
      expect(error.severity).toBe("high");
      expect(error.operation).toBe("test-operation");
      expect(error.metadata).toEqual({ test: true });
      expect(error.recoverable).toBe(false); // animation errors are not recoverable by default
      expect(error.retryable).toBe(false);
    });

    it("should generate appropriate user messages", () => {
      const exportError = createExportError("test-export", new Error("Failed"));
      expect(exportError.userMessage).toContain("Export failed");
      expect(exportError.retryable).toBe(true);

      const storageError = createStorageError("test-storage", new Error("Failed"));
      expect(storageError.userMessage).toContain("save/load data");
      expect(storageError.recoverable).toBe(true);
    });

    it("should serialize to JSON properly", () => {
      const error = createAnimationError("test", new Error("Test error"));
      const json = error.toJSON();

      expect(json.name).toBe("AppError");
      expect(json.category).toBe("animation");
      expect(json.operation).toBe("test");
      expect(json.message).toBe("Test error");
      expect(typeof json.timestamp).toBe("number");
    });
  });

  describe("ErrorManager", () => {
    it("should log errors properly", async () => {
      const error = createAnimationError("test", new Error("Test error"));
      await errorManager.handleError(error);

      const log = errorManager.getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0]).toBe(error);
    });

    it("should generate error statistics", async () => {
      await errorManager.handleError(createAnimationError("test1", new Error("Error 1")));
      await errorManager.handleError(createExportError("test2", new Error("Error 2")));
      await errorManager.handleError(createAnimationError("test3", new Error("Error 3")));

      const stats = errorManager.getErrorStats();
      expect(stats.animation.count).toBe(2);
      expect(stats.export.count).toBe(1);
      expect(stats.animation.lastOccurrence).toBeGreaterThan(0);
    });

    it("should clear error log", async () => {
      await errorManager.handleError(createAnimationError("test", new Error("Test")));
      expect(errorManager.getErrorLog()).toHaveLength(1);

      errorManager.clearErrorLog();
      expect(errorManager.getErrorLog()).toHaveLength(0);
    });
  });

  describe("Utility Functions", () => {
    describe("safeSyncOperation", () => {
      it("should return result on success", () => {
        const result = safeSyncOperation(
          () => "success",
          "fallback",
          { category: "system", operation: "test" }
        );
        expect(result).toBe("success");
      });

      it("should return fallback on error", () => {
        const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const result = safeSyncOperation(
          () => {
            throw new Error("Test error");
          },
          "fallback",
          { category: "system", operation: "test" }
        );

        expect(result).toBe("fallback");
        expect(errorManager.getErrorLog()).toHaveLength(1);

        consoleSpy.mockRestore();
      });
    });

    describe("withRetry", () => {
      it("should succeed on first attempt", async () => {
        const operation = vi.fn().mockResolvedValue("success");
        const result = await withRetry(operation, 3);

        expect(result).toBe("success");
        expect(operation).toHaveBeenCalledTimes(1);
      });

      it("should retry on failure and eventually succeed", async () => {
        const operation = vi.fn()
          .mockRejectedValueOnce(new Error("Fail 1"))
          .mockRejectedValueOnce(new Error("Fail 2"))
          .mockResolvedValue("success");

        const result = await withRetry(operation, 3, 1); // 1ms delay for fast testing

        expect(result).toBe("success");
        expect(operation).toHaveBeenCalledTimes(3);
      });

      it("should throw AppError after max attempts", async () => {
        const operation = vi.fn().mockRejectedValue(new Error("Always fails"));

        await expect(withRetry(operation, 2, 1)).rejects.toThrow(AppError);
        expect(operation).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Error Categories", () => {
    it("should create animation errors correctly", () => {
      const error = createAnimationError("render", new Error("Render failed"), { frameIndex: 5 });
      expect(error.category).toBe("animation");
      expect(error.operation).toBe("render");
      expect(error.metadata.frameIndex).toBe(5);
      expect(error.userMessage).toContain("Animation rendering");
    });

    it("should create export errors correctly", () => {
      const error = createExportError("webm-export", new Error("Export failed"));
      expect(error.category).toBe("export");
      expect(error.operation).toBe("webm-export");
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toContain("Export failed");
    });

    it("should create storage errors correctly", () => {
      const error = createStorageError("save-presets", new Error("Storage full"));
      expect(error.category).toBe("storage");
      expect(error.operation).toBe("save-presets");
      expect(error.recoverable).toBe(true);
      expect(error.userMessage).toContain("storage");
    });
  });
});