"use client";
import { useCallback, useEffect, useState } from "react";
import { chaosIdentityHeaders } from "./chaos-client-identity";

export type ChaosAccount = { player: { id: string; name: string } | null };
const requests = new Map<string, Promise<ChaosAccount>>();
function fetchAccount(): Promise<ChaosAccount> {
  const headers = chaosIdentityHeaders();
  const key = headers["X-Chaos-Identity"] ?? "website";
  const pending = requests.get(key);
  if (pending) return pending;
  const request = fetch("/api/chaos/account", { headers, cache: "no-store" })
    .then(response => {
      if (!response.ok) throw new Error("Could not check sign-in");
      return response.json() as Promise<ChaosAccount>;
    }).finally(() => requests.delete(key));
  requests.set(key, request);
  return request;
}
export function useChaosAccount() {
  const [state, setState] = useState<{data?: ChaosAccount; error?: Error; isLoading: boolean}>({isLoading:true});
  const [revision, setRevision] = useState(0);
  const mutate = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let active = true;
    setState(previous => ({...previous, error:undefined, isLoading:true}));
    fetchAccount().then(data => {
      if (active) setState({data,isLoading:false});
    }).catch(error => {
      if (active) setState({error,isLoading:false});
    });
    window.addEventListener("focus", mutate);
    return () => { active = false; window.removeEventListener("focus", mutate); };
  }, [revision, mutate]);
  return {...state, mutate};
}
