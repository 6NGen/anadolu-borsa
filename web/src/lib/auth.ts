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

// Google ile giriş — bedava. Supabase Dashboard'da Google provider açık olmalı.
// Başarılı dönüşte detectSessionInUrl oturumu kurar, useUser yakalar.
export async function googleGiris(donus = "/fiyat-bildir") {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: typeof window !== "undefined" ? window.location.origin + donus : undefined },
  });
}
