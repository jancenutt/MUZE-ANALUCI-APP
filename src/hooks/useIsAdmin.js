import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    base44.auth
      .me()
      .then((user) => {
        if (alive) setIsAdmin(user?.role === "admin");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return isAdmin;
}