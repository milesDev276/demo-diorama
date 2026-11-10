"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDioramaList, type DioramaListState } from "@/features/dioramas/hooks/useDioramaList";

const HomeCollectionContext = createContext<DioramaListState>({ status: "loading" });

/**
 * Reads this browser's dioramas once for the whole home page, so its hero
 * buttons and "Your dioramas" agree (plan/Stage-23-Implementation.md D4).
 * The page is rendered without them first: they live in IndexedDB.
 */
export function HomeCollectionProvider({ children }: { children: ReactNode }) {
  const { state } = useDioramaList();
  return <HomeCollectionContext.Provider value={state}>{children}</HomeCollectionContext.Provider>;
}

export function useHomeCollection(): DioramaListState {
  return useContext(HomeCollectionContext);
}
