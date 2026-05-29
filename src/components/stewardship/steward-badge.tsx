"use client";

import { useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import {
  subscribe,
  getPledgeSnapshot,
  getServerPledgeSnapshot,
} from "@/lib/stewardship/pledge";

/** Compact Trail Steward badge, earned by taking the Leave No Trace pledge or
 *  by contributing (`contributionCount >= 1`, resolved server-side from the
 *  signed-in user's recognized contributions). Renders nothing otherwise. */
export function StewardBadge({
  contributionCount = 0,
}: {
  contributionCount?: number;
}) {
  const pledge = useSyncExternalStore(
    subscribe,
    getPledgeSnapshot,
    getServerPledgeSnapshot,
  );
  if (!pledge && contributionCount < 1) return null;
  return <Badge variant="forest">Trail Steward</Badge>;
}
