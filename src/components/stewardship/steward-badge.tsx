"use client";

import { useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import {
  subscribe,
  getPledgeSnapshot,
  getServerPledgeSnapshot,
} from "@/lib/stewardship/pledge";

/** Compact Trail Steward badge, shown once the Leave No Trace pledge is taken.
 *  Renders nothing otherwise. */
export function StewardBadge() {
  const pledge = useSyncExternalStore(
    subscribe,
    getPledgeSnapshot,
    getServerPledgeSnapshot,
  );
  if (!pledge) return null;
  return <Badge variant="forest">Trail Steward</Badge>;
}
