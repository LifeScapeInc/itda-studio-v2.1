"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useImportStore } from "@/stores/useImportStore";
import { projectExistsForCase, useProjectStore } from "@/stores/useProjectStore";
import { getCaseKey, hasExistingProject, type IntegrationCase } from "@/system/integrations/cases";
export function useImportWorkspace() {
  const router = useRouter();
  const importStore = useImportStore();
  const loadCases = importStore.loadCases;
  const projects = useProjectStore(state => state.projects);
  const createProjectFromCase = useProjectStore(state => state.createProjectFromCase);
  useEffect(() => {
    void loadCases();
  }, [loadCases]);
  const selectedCustomer = importStore.customers.find(customer => customer.email === importStore.selectedCustomerEmail);
  const caseHasProject = (item: IntegrationCase) => hasExistingProject(item) || projectExistsForCase(projects, item);
  const availableCases = selectedCustomer?.cases.filter(item => !caseHasProject(item)) ?? [];
  const existingProjectCases = selectedCustomer?.cases.filter(caseHasProject) ?? [];
  const selectedCase = availableCases.find(item => getCaseKey(item) === importStore.selectedCaseKey);
  const createProject = () => {
    if (!selectedCase) return;
    createProjectFromCase(selectedCase);
    importStore.returnToCustomerList();
    router.push("/projects");
  };
  return {
    ...importStore,
    customer: selectedCustomer,
    available: availableCases,
    existing: existingProjectCases,
    selected: selectedCase,
    createProject
  };
}
