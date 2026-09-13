import { redirect } from "next/navigation";

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

import { headers } from "next/headers";
import AdminIndexPage from "./page";

describe("AdminIndexPage", () => {
  it("redirects to /admin/chat for the default locale", async () => {
    (headers as jest.Mock).mockResolvedValue(new Headers());

    await expect(AdminIndexPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/en-gb/admin/chat");
  });

  it("redirects to /admin/chat preserving a non-default locale", async () => {
    (headers as jest.Mock).mockResolvedValue(
      new Headers({ "x-portfolio-locale": "fr" })
    );

    await expect(AdminIndexPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/fr/admin/chat");
  });
});
