import { AppSidebar } from "@/development/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/development/components/ui/breadcrumb";
import { Separator } from "@/development/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/development/components/ui/sidebar";
import Loader from "@/development/components/Loader";
import Context from "@/development/Context/Context";
import { useContext, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

export default function DashboardLayout() {
  const { loader, loadDashboardData } = useContext(Context);
  const { pathname } = useLocation();

  // Extract page name from pathname
  const pageName = pathname.split("/")[2] || "";

  // Load all dashboard data once when layout mounts
  useEffect(() => {
    if (loadDashboardData) {
      loadDashboardData();
    }
  }, [loadDashboardData]);

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "19rem",
      }}
    >
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb className="poppins-semibold">
            <BreadcrumbList>
              <BreadcrumbItem className="hidden max-md:text-sm md:block">
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              {pageName && (
                <>
                  <BreadcrumbSeparator className="" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {pageName.charAt(0).toUpperCase() + pageName.slice(1).replace('-', ' ')}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-2 md:gap-4 px-4 md:px-8 md:py-4 bg-stone-50">
          {<Outlet /> || (
            <div className="flex flex-1 items-center justify-center">
              <p className="poppins-regular text-stone-400">
                Select a menu item to get started
              </p>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
