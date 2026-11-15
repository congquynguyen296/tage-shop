"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/config/routes";

export default function AdminOrdersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(APP_ROUTES.ADMIN.PRODUCTS);
  }, [router]);

  return null;
}
