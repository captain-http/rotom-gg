"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { joinWaitlist } from "@/lib/domain/waitlist";

// 254 is the longest an address can be, per RFC 5321.
const JoinWaitlistInput = z.object({
  email: z.string().trim().max(254).pipe(z.email()),
});

export async function joinWaitlistAction(formData: FormData) {
  const parsed = JoinWaitlistInput.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    redirect("/?status=rejected");
  }

  await joinWaitlist(parsed.data);
  // The same answer whether the address was new or already on the list, so
  // the form can't be used to find out who has signed up.
  redirect("/?status=filed");
}
