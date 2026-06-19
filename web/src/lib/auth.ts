"use client";
// Oturum durumu için paylaşılan hook. Tarayıcı supabase client'ı (anon key)
// oturumu localStorage'da tutar; onAuthStateChange tüm sekmeleri senkron tutar.
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setYukleniyor(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_olay, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, yukleniyor };
}

export async function cikisYap() {
  await supabase.auth.signOut();
}

// "0532...", "532...", "+90532..." → "+905XXXXXXXXX" (E.164); geçersizse null.
export function telefonNormalize(ham: string): string | null {
  let n = ham.replace(/\D/g, "");
  if (n.startsWith("90")) n = n.slice(2);
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length !== 10 || !n.startsWith("5")) return null;
  return "+90" + n;
}
