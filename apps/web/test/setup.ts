import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// next/font is a Next-compiler-only feature. Stub it for unit tests.
vi.mock("next/font/google", () => ({
  Roboto: () => ({
    className: "roboto",
    style: { fontFamily: "Roboto, sans-serif" },
    variable: "--font-roboto",
  }),
}));

// Stub next/navigation hooks used by client components in unit tests.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// next-auth/react requires a SessionProvider; default to unauthenticated.
vi.mock("next-auth/react", async () => {
  const actual =
    await vi.importActual<typeof import("next-auth/react")>("next-auth/react");
  return {
    ...actual,
    useSession: () => ({ data: null, status: "unauthenticated" }),
    signIn: vi.fn(),
    signOut: vi.fn(),
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});
