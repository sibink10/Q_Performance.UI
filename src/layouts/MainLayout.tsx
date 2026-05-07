// @ts-nocheck
// src/layouts/MainLayout
// Persistent shell layout with:
//   - Top AppBar with org branding + user menu
//   - Side navigation drawer (role-aware); overlay on narrow viewports
//   - Content outlet

import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleIcon from "@mui/icons-material/People";
import StarIcon from "@mui/icons-material/Star";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LogoutIcon from "@mui/icons-material/Logout";
import useAuth from "../hooks/useAuth";
import { MAIN_LAYOUT_APP_BAR_HEIGHT } from "../components/common/PageHeader";
import { getAppBarTitle } from "../utils/appBarTitle";
import productLogo from "../assets/qubiqon_logo.jpg";

const DRAWER_WIDTH = 272;

const EMPLOYEE_NAV = [
  { label: "My Reviews", icon: <AssignmentIcon />, path: "/performance" },
  { label: "My Results", icon: <StarIcon />, path: "/performance/results" },
];

const ADMIN_NAV = [
  {
    section: "Operations",
    items: [
      {
        label: "Assign Review Forms",
        icon: <AssignmentIcon />,
        path: "/operations/performance/assign",
        matchPaths: [
          "/operations/performance/assignments",
          "/operations/performance/assignments/employees",
        ],
      },
    ],
  },
  {
    section: "Configuration",
    items: [
      {
        label: "Financial Years",
        icon: <SettingsIcon />,
        path: "/config/performance/financial-years",
      },
      {
        label: "Appraisal Config",
        icon: <SettingsIcon />,
        path: "/config/performance/appraisal-config",
      },
      {
        label: "Focus Areas",
        icon: <PeopleIcon />,
        path: "/config/performance/focus-areas",
      },
      {
        label: "Review Forms",
        icon: <AssignmentIcon />,
        path: "/config/performance/review-forms",
      },
    ],
  },
];

const DrawerPaperBg = "#ffffff";

/** Among sibling paths, picks the longest that matches pathname (exact or deeper segment). */
function getActiveNavPath(items, pathname) {
  const toCandidatePaths = (item) => {
    const candidates = [];
    if (item?.path) candidates.push(item.path);
    if (Array.isArray(item?.matchPaths)) candidates.push(...item.matchPaths);
    return candidates
      .filter(Boolean)
      .map((p) => String(p).replace(/\/$/, ""))
      .filter((p) => p.length > 0);
  };

  const normalizedPathname = String(pathname || "").replace(/\/$/, "") || "/";

  // Evaluate longer (more specific) paths first.
  const sortedItems = [...items].sort((a, b) => {
    const aLongest = Math.max(0, ...toCandidatePaths(a).map((p) => p.length));
    const bLongest = Math.max(0, ...toCandidatePaths(b).map((p) => p.length));
    return bLongest - aLongest;
  });

  for (const item of sortedItems) {
    for (const candidate of toCandidatePaths(item)) {
      if (
        normalizedPathname === candidate ||
        normalizedPathname.startsWith(`${candidate}/`)
      ) {
        return item.path;
      }
    }
  }

  return undefined;
}

const MainLayout = () => {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const headerTitle = getAppBarTitle(location.pathname, location.search);
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || "User";
  const [drawerOpen, setDrawerOpen] = useState(isMdUp);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    setDrawerOpen(isMdUp);
  }, [isMdUp]);

  useEffect(() => {
    if (!isMdUp) setDrawerOpen(false);
  }, [location.pathname, isMdUp]);

  const handleNavigate = (path) => {
    navigate(path);
    if (!isMdUp) setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    if (!isMdUp) setDrawerOpen(false);
  };

  const activeEmployeePath = getActiveNavPath(EMPLOYEE_NAV, location.pathname);
  const drawerText = theme.palette.text.primary;
  const drawerMuted = alpha(theme.palette.text.secondary, 0.78);
  const navBtnSx = {
    borderRadius: "8px",
    mb: 0.25,
    color: drawerText,
    py: 0.75,
    transition: "background-color 0.2s, color 0.2s, box-shadow 0.2s",
    "& .MuiListItemIcon-root": { color: drawerMuted, minWidth: 40 },
    "&.Mui-selected": {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
      color: theme.palette.primary.dark,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
      boxShadow: `0 10px 22px -18px ${alpha(theme.palette.primary.main, 0.45)}`,
      "& .MuiListItemIcon-root": { color: theme.palette.primary.main },
    },
    "&.Mui-selected::before": {
      content: '""',
      position: "absolute",
      left: 6,
      top: 10,
      bottom: 10,
      width: 3,
      borderRadius: 999,
      backgroundColor: theme.palette.primary.main,
    },
    "&.Mui-selected:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.16),
    },
    "&:hover": { bgcolor: alpha(theme.palette.grey[900], 0.04) },
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: DrawerPaperBg,
        color: drawerText,
        borderRight: `1px solid ${alpha(theme.palette.grey[900], 0.08)}`,
      }}
    >
      <Box
        sx={{
          padding: "20px",
          paddingTop: "16px",
          paddingBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 100%)`,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            overflow: "hidden",
            background: alpha(theme.palette.primary.main, 0.12),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 10px 26px -18px ${alpha(theme.palette.primary.main, 0.8)}`,
          }}
        >
          <Box
            component="img"
            src={productLogo}
            alt="Qubiqon logo"
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            lineHeight={1}
            sx={{ color: theme.palette.text.primary }}
          >
            QHRMS
          </Typography>
          <Typography variant="caption" sx={{ color: drawerMuted }}>
            Performance
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: alpha(theme.palette.grey[900], 0.08) }} />

      <List
        dense
        sx={{
          px: 1.25,
          pt: 1.5,
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "thin",
          scrollbarColor: `${alpha(theme.palette.primary.main, 0.6)} ${alpha(theme.palette.grey[900], 0.06)}`,
          "&::-webkit-scrollbar": {
            width: 1,
          },
          "&::-webkit-scrollbar-track": {
            background: alpha(theme.palette.grey[900], 0.03),
            borderRadius: 999,
          },
          "&::-webkit-scrollbar-thumb": {
            background: alpha(theme.palette.primary.main, 0.55),
            borderRadius: 999,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: alpha(theme.palette.primary.main, 0.7),
          },
        }}
      >
        <ListItem disablePadding>
          <Typography
            variant="overline"
            sx={{
              px: 1,
              py: 0.75,
              color: alpha(theme.palette.primary.main, 0.88),
              fontSize: theme.typography.overline.fontSize,
              letterSpacing: 1.2,
              fontWeight: 700,
            }}
          >
            My Performance
          </Typography>
        </ListItem>
        {EMPLOYEE_NAV.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={activeEmployeePath === item.path}
              onClick={() => handleNavigate(item.path)}
              sx={navBtnSx}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        {isAdmin &&
          ADMIN_NAV.map((section) => {
            const activeInSection = getActiveNavPath(
              section.items,
              location.pathname,
            );
            return (
              <Box key={section.section}>
                <Divider
                  sx={{
                    my: 1.25,
                    borderColor: alpha(theme.palette.grey[900], 0.08),
                  }}
                />
                <ListItem disablePadding>
                  <Typography
                    variant="overline"
                    sx={{
                      px: 1,
                      py: 0.75,
                      color: alpha(theme.palette.primary.main, 0.88),
                      fontSize: theme.typography.overline.fontSize,
                      letterSpacing: 1.2,
                      fontWeight: 700,
                    }}
                  >
                    {section.section}
                  </Typography>
                </ListItem>
                {section.items.map((item) => (
                  <ListItem key={item.path} disablePadding>
                    <ListItemButton
                      selected={activeInSection === item.path}
                      onClick={() => handleNavigate(item.path)}
                      sx={navBtnSx}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </Box>
            );
          })}

        <Divider
          sx={{ my: 1, borderColor: alpha(theme.palette.grey[900], 0.08) }}
        />
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            selected={false}
            sx={{
              borderRadius: 2.5,
              py: 1,
              mb: 0.5,
              color: drawerText,
              transition: "background-color 0.2s",
              "& .MuiListItemIcon-root": { color: drawerMuted, minWidth: 40 },
              "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.08) },
            }}
          >
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Sign out"
              primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>
      </List>

      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${alpha(theme.palette.grey[900], 0.08)}`,
          background: `linear-gradient(0deg, ${alpha(theme.palette.grey[900], 0.02)} 0%, transparent 100%)`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              fontSize: 14,
              fontWeight: 700,
              background: alpha(theme.palette.primary.main, 0.14),
              color: theme.palette.primary.dark,
            }}
          >
            {user?.name?.[0] || "U"}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography
              variant="body2"
              fontWeight={700}
              noWrap
              sx={{ color: theme.palette.text.primary }}
            >
              {user?.name}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: drawerMuted }}>
              {user?.email}
            </Typography>
          </Box>
          {isAdmin && (
            <Chip
              label="Admin"
              size="small"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.dark,
                borderColor: alpha(theme.palette.primary.main, 0.35),
                background: alpha(theme.palette.primary.main, 0.12),
              }}
              variant="outlined"
            />
          )}
        </Box>
      </Box>
    </Box>
  );

  const appBarWidth =
    isMdUp && drawerOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : "100%";
  const appBarMl = isMdUp && drawerOpen ? `${DRAWER_WIDTH}px` : 0;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        color="inherit"
        sx={{
          width: appBarWidth,
          ml: appBarMl,
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            minHeight: MAIN_LAYOUT_APP_BAR_HEIGHT,
            height: MAIN_LAYOUT_APP_BAR_HEIGHT,
            px: { xs: 1.5, sm: 2 },
            gap: { xs: 1, sm: 1.5 },
            borderRadius: 0,
          }}
        >
          <IconButton
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label={drawerOpen ? "Close navigation" : "Open navigation"}
            sx={{
              color: "text.secondary",
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.grey[900], 0.12)}`,
              bgcolor: alpha(
                theme.palette.grey[100],
                theme.palette.mode === "light" ? 1 : 0.08,
              ),
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                borderColor: alpha(theme.palette.primary.main, 0.28),
                color: "primary.main",
              },
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>

          <Box sx={{ flex: 1, minWidth: 0, py: 0.25 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                lineHeight: 1.15,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: theme.typography.overline.fontSize,
                fontWeight: 600,
              }}
            >
              Workspace
            </Typography>
            <Typography
              component="h1"
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
                color: "text.primary",
              }}
              noWrap
            >
              {headerTitle}
            </Typography>
          </Box>

          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              flexDirection: "column",
              alignItems: "flex-end",
              mr: 0.25,
              minWidth: 0,
              maxWidth: 220,
            }}
          >
            <Typography
              variant="body2"
              fontWeight={700}
              noWrap
              sx={{ color: "text.primary" }}
            >
              Hi, {firstName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {isAdmin ? "Administrator" : "Team member"}
            </Typography>
          </Box>

          <Tooltip title="Account menu">
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              size="small"
              sx={{
                p: 0.5,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.grey[900], 0.12)}`,
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
              }}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl)}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.25,
                  pl: 0.25,
                  pr: 0.5,
                }}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    fontSize: 14,
                    fontWeight: 800,
                    background: theme.palette.primary.main,
                  }}
                >
                  {user?.name?.[0] || "U"}
                </Avatar>
                <KeyboardArrowDownIcon
                  sx={{ fontSize: 20, color: "text.secondary" }}
                />
              </Box>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{
              elevation: 8,
              sx: {
                mt: 1,
                minWidth: 220,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.grey[900], 0.12)}`,
                boxShadow: `0 16px 48px ${alpha("#0f172a", 0.12)}`,
              },
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {user?.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                noWrap
              >
                {user?.email}
              </Typography>
            </Box>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                handleLogout();
              }}
              sx={{ py: 1.25, gap: 1 }}
            >
              <LogoutIcon fontSize="small" sx={{ color: "text.secondary" }} />
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMdUp ? "persistent" : "temporary"}
        open={drawerOpen}
        onClose={() => !isMdUp && setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "none",
            ...(isMdUp
              ? {}
              : {
                  boxShadow: "8px 0 40px rgba(15, 23, 42, 0.35)",
                }),
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          mt: `${MAIN_LAYOUT_APP_BAR_HEIGHT}px`,
          bgcolor: "transparent",
          minHeight: `calc(100vh - ${MAIN_LAYOUT_APP_BAR_HEIGHT}px)`,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
