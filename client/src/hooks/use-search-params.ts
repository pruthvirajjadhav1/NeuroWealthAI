import { useLocation } from "wouter";

export function useSearchParams(): [URLSearchParams, (search: string) => void] {
  const [location, setLocation] = useLocation();
  
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  
  const setSearchParams = (search: string) => {
    const [pathname] = location.split("?");
    setLocation(`${pathname}${search ? `?${search}` : ""}`);
  };
  
  return [searchParams, setSearchParams];
}
