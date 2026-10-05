import { createContext, useContext } from 'react';
import type { InAppCustomData } from 'reteno-react-native-sdk';

export type LinkEventRecord = {
  id: number;
  receivedAt: string;
  data: InAppCustomData;
};

type LinkEventMonitorValue = {
  events: LinkEventRecord[];
  clearEvents: () => void;
};

export const LinkEventMonitorContext =
  createContext<LinkEventMonitorValue | null>(null);

export function useLinkEventMonitor(): LinkEventMonitorValue {
  const value = useContext(LinkEventMonitorContext);

  if (!value) {
    throw new Error(
      'useLinkEventMonitor must be used inside LinkEventMonitorContext.Provider'
    );
  }

  return value;
}
