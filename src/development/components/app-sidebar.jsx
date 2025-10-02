import * as React from "react";
import {
  Users,
  UserCheck,
  Calendar,
  CreditCard,
  Package,
  BarChart3,
  Truck,
  Receipt,
  Gift,
  Scissors,
  Briefcase
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/development/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import Context from "@/development/Context/Context";

const data = {
  navMain: [
    {
      title: "Management",
      url: "#",
      items: [
        {
          title: "Staffs",
          icon: Users,
          url: "/dashboard/staffs",
        },
        {
          title: "Clients",
          icon: UserCheck,
          url: "/dashboard/clients",
        },
        {
          title: "Appointments",
          icon: Calendar,
          url: "/dashboard/appointments",
        },
        {
          title: "Billing",
          icon: CreditCard,
          url: "/dashboard/billing",
        },
        {
          title: "Services",
          icon: Briefcase,
          url: "/dashboard/service",
        },
        {
          title: "Inventory",
          icon: Package,
          url: "/dashboard/inventory",
        },
        {
          title: "Reports",
          icon: BarChart3,
          url: "/dashboard/reports",
        },
        {
          title: "Vendor Management",
          icon: Truck,
          url: "/dashboard/vendor-management",
        },
        {
          title: "Expense Management",
          icon: Receipt,
          url: "/dashboard/expense-management",
        },
        // {
        //   title: "Loyalty Points",
        //   icon: Gift,
        //   url: "/dashboard/loyalty-points",
        // },
      ],
    },
  ],
};

export function AppSidebar({ ...props }) {
  const { institutionData } = React.useContext(Context);
  const { pathname } = useLocation();
  const [navData, setNavData] = React.useState(data);

  React.useEffect(() => {
    const subGroup = pathname.split("/")[2];
    const item = pathname.split("/")[3];
    console.log("Current sub-group:", subGroup);
    console.log("Current item:", item);

    const updatedNavData = {
      ...navData,
      navMain: navData.navMain.map((group) => ({
        ...group,
        items: group.items.map((navItem) => ({
          ...navItem,
          isActive: navItem.url === pathname,
        })),
      })),
    };

    setNavData(updatedNavData);
  }, [pathname]);

  return (
    <Sidebar variant="floating" className="bg-stone-900 border-stone-800 border-b-[1rem]  shadow-lg" {...props}>
      <SidebarHeader className="bg-stone-800 border-b border-stone-700">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-stone-700 text-white">
                  <Scissors className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="poppins-bold font-semibold text-white">
                    <Link to="/">
                      {institutionData?.companyName || "Salon"}
                    </Link>
                  </span>
                  <span className="poppins-light font-[10px] text-stone-300">
                    Salon Management
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-stone-900">
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {navData.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton className="cursor-default hover:bg-transparent bg-stone-800">
                  <div className="poppins-regular font-medium text-stone-300">
                    {item.title}
                  </div>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub className="ml-0 mt-1 w-full gap-2 border-l-0">
                    {item.items.map((item) => (
                      <Link to={item.url} key={item.title}>
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            className="poppins-regular py-5 hover:bg-stone-800 data-[active=true]:bg-stone-700 data-[active=true]:text-white bg-stone-900"
                            isActive={item.isActive}
                          >
                            <div className="flex items-center gap-3">
                              {item.icon && (
                                <item.icon
                                  size={20}
                                  className="text-stone-300 data-[active=true]:text-white"
                                />
                              )}
                              <p className="poppins-regular text-[.9rem] text-stone-200 data-[active=true]:text-white">
                                {item.title}
                              </p>
                            </div>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </Link>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
