export {};

declare global {
  interface Window {
    electron?: {
      // 🔹 Auth
      sendToken: (token: string) => Promise<{
        success: boolean;
        uid?: string;
        name?: string;
        email?: string;
        photoURL?: string;
        role?: string;
        error?: string;
      }>;

      onAuthStatus: (callback: (data: any) => void) => void;
      onceAuthStatus: (callback: (data: any) => void) => void;

      // 🔹 SQL Management
      getBrands: () => Promise<{
        success: boolean;
        brands?: string[];
        error?: string;
      }>;
      getFiles: (
        brand: string
      ) => Promise<{ success: boolean; files?: string[]; error?: string }>;
      getFileContent: (
        brand: string,
        file: string
      ) => Promise<{ success: boolean; content?: string; error?: string }>;

      saveFileContent: (
        brand: string,
        file: string,
        content: string
      ) => Promise<{
        success: boolean;
        type?: string;
        title?: string;
        data?: Array;
        columns?: Array;
        error?: string;
      }>;

      getCredentials: () => Promise<{
        success: boolean;
        credentials?: { username: string; password: string };
        error?: string;
      }>;

      saveCredentials: (creds: {
        username: string;
        password: string;
      }) => Promise<{ success: boolean; error?: string }>;
    };
  }
}
