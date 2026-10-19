import { createContext, useContext } from "react";

/** What the contact list shares with its rows: the selected contact and how to select one. */
export interface ChatSelection {
  selected: string;
  select: (value: string) => void;
}

function ignore(): void {}

export const ChatSelectionContext = createContext<ChatSelection>({ selected: "", select: ignore });

export function useChatSelection(): ChatSelection {
  return useContext(ChatSelectionContext);
}
