"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import MenuIcon from "@mui/icons-material/Menu";
import FolderIcon from "@mui/icons-material/Folder";
import ScienceIcon from "@mui/icons-material/Science";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import MapIcon from "@mui/icons-material/Map";
import OpacityIcon from "@mui/icons-material/Opacity";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import HubIcon from "@mui/icons-material/Hub";
import WorkIcon from "@mui/icons-material/Work";
import BiotechIcon from "@mui/icons-material/Biotech";
import GroupsIcon from "@mui/icons-material/Groups";
import { signIn, signOut, useSession } from "next-auth/react";

const DRAWER_WIDTH = 240;

const navItems = [
  { label: "Projects", href: "/projects", icon: <FolderIcon /> },
  { label: "Models", href: "/models", icon: <ScienceIcon /> },
  { label: "Maps", href: "/maps", icon: <MapIcon /> },
  { label: "Media", href: "/media", icon: <OpacityIcon /> },
  { label: "Designs", href: "/designs", icon: <DesignServicesIcon /> },
  {
    label: "Interactive Map",
    href: "/interactive-map",
    icon: <AccountTreeIcon />,
  },
  { label: "Jobs", href: "/jobs", icon: <WorkIcon /> },
  { label: "Experiments", href: "/experiments", icon: <BiotechIcon /> },
  {
    label: "Community Modeling",
    href: "/community-modeling",
    icon: <GroupsIcon />,
  },
  { label: "Strains", href: "/strains", icon: <HubIcon /> },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
        color="primary"
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setOpen((v) => !v)}
            sx={{ mr: 2 }}
            aria-label="toggle navigation"
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{ flexGrow: 1, color: "inherit", textDecoration: "none" }}
          >
            Caffeine
          </Typography>
          {status === "authenticated" ? (
            <>
              <Typography variant="body2" sx={{ mr: 2 }}>
                {session.user?.email}
              </Typography>
              <Button color="inherit" onClick={() => signOut()}>
                Sign out
              </Button>
            </>
          ) : (
            <Button color="inherit" onClick={() => signIn()}>
              Sign in
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        open={open}
        sx={{
          width: open ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={pathname === item.href}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: open ? 0 : `-${DRAWER_WIDTH}px`,
          transition: (t) =>
            t.transitions.create("margin", {
              duration: t.transitions.duration.standard,
            }),
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
