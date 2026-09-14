import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/federation.functions";
import { describeFailure } from "./roles";

/**
 * Wraps a stored-procedure server function: surfaces invariant codes
 * (INV-01 … INV-09) as toasts and refreshes affected queries on success.
 */
export function useProcedure<TInput>(
  run: (input: TInput) => Promise<ActionResult>,
  invalidate: string[] = [],
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TInput) => run(input),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(result.message);
        for (const key of invalidate) void queryClient.invalidateQueries({ queryKey: [key] });
      } else {
        toast.error(describeFailure(result.code, result.message));
      }
    },
    onError: () => toast.error("The request could not be sent. Please try again."),
  });
}
