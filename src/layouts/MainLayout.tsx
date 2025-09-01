import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import BottomNav from "../components/BottomNav";

export default function MainLayout() {
  const { pathname, search } = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return (
    <>
      <div ref={contentRef} className="viewport">
        <div className="app">
          <Outlet />
        </div>
      </div>
      <BottomNav />
    </>
  );
}
