"use client";

import { create } from "zustand";
import {
  groupCasesByEmail,
  isCasesResponse,
  readCasesApiResponse,
  type CustomerCaseGroup,
} from "@/system/integrations/cases";
type ImportStatus = "idle" | "loading" | "success" | "error";
type ImportStore = {
  customers: CustomerCaseGroup[];
  status: ImportStatus;
  error: string | null;
  selectedCustomerEmail: string | null;
  selectedCaseKey: string | null;
  selectCustomer: (email: string) => void;
  selectCase: (caseKey: string) => void;
  returnToCustomerList: () => void;
  loadCases: () => Promise<void>;
};
export const useImportStore = create<ImportStore>((set, get) => ({
  customers: [],
  status: "idle",
  error: null,
  selectedCustomerEmail: null,
  selectedCaseKey: null,
  selectCustomer: email => set({
    selectedCustomerEmail: email,
    selectedCaseKey: null
  }),
  selectCase: caseKey => set({
    selectedCaseKey: caseKey
  }),
  returnToCustomerList: () => set({
    selectedCustomerEmail: null,
    selectedCaseKey: null
  }),
  loadCases: async () => {
    if (get().status === "loading") {
      return;
    }
    set({
      status: "loading",
      error: null
    });
    try {
      const response = await fetch("/api/integrations/cases", {
        method: "GET",
        cache: "no-store"
      });
      const data = await readCasesApiResponse(response);
      if (!response.ok) {
        const message = data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : "case 정보를 가져오지 못했습니다.";
        throw new Error(message);
      }
      if (!isCasesResponse(data)) {
        throw new Error("case 응답 형식이 올바르지 않습니다.");
      }
      set({
        customers: groupCasesByEmail(data.cases),
        status: "success",
        error: null
      });
    } catch (error) {
      set({
        customers: [],
        status: "error",
        error: error instanceof Error ? error.message : "case 정보를 가져오지 못했습니다.",
        selectedCustomerEmail: null,
        selectedCaseKey: null
      });
    }
  }
}));
