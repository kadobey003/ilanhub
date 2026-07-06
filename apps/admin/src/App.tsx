import { useState } from "react";
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { BrandLogo } from "./components/BrandLogo";
import { IconLogout, IconMenu } from "./components/icons";
import { navGroups, pageTitles } from "./nav-config";
import { Dashboard } from "./pages/Dashboard";
import { Listings } from "./pages/Listings";
import { Projects } from "./pages/Projects";
import { Cities } from "./pages/Cities";
import { Channels } from "./pages/Channels";
import { Publications } from "./pages/Publications";
import { Payments } from "./pages/Payments";
import { Analytics } from "./pages/Analytics";
import { Users } from "./pages/Users";
import { Pricing } from "./pages/Pricing";
import { Managers } from "./pages/Managers";
import { Telegram } from "./pages/Telegram";
import { Branding } from "./pages/Branding";
import { Login } from "./pages/Login";
import { Categories } from "./pages/Categories";

function Layout() {
  const { manager, logout, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Завантаження...</p>
      </div>
    );
  }
  if (!manager) return <Navigate to="/login" replace />;

  const pageTitle = pageTitles[location.pathname] ?? "Admin";
  const initials = manager.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`app-shell${sidebarOpen ? " sidebar-open" : ""}`}>
      <div
        className="sidebar-backdrop"
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />

      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <BrandLogo size={40} />
            <div className="brand-text">
              <span className="brand-name">UAREKLAMHUB</span>
              <span className="brand-tag">Admin Panel</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => {
            const items = group.items.filter(
              (l) => !l.superOnly || manager.role === "super_admin",
            );
            if (!items.length) return null;
            return (
              <div key={group.title} className="nav-group">
                <span className="nav-group-title">{group.title}</span>
                {items.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === "/"}
                    className={({ isActive }) =>
                      `nav-link${isActive ? " nav-link-active" : ""}`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="nav-link-icon">{l.icon}</span>
                    {l.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="user-avatar">{initials}</span>
            <div>
              <span className="user-name">{manager.name}</span>
              <span className="user-role">
                {manager.role === "super_admin" ? "Super Admin" : "Менеджер"}
              </span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <IconLogout size={16} />
            Вийти
          </button>
        </div>
      </aside>

      <div className="app-body">
        <header className="topbar">
          <button
            type="button"
            className="topbar-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Меню"
          >
            <IconMenu size={20} />
          </button>
          <div className="topbar-title">{pageTitle}</div>
          <div className="topbar-right">
            <span className="topbar-user-chip">
              <span className="user-avatar user-avatar-sm">{initials}</span>
              {manager.name}
            </span>
          </div>
        </header>

        <main className="main">
          <div className="page-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="listings" element={<Listings />} />
        <Route path="users" element={<Users />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="projects" element={<Projects />} />
        <Route path="categories" element={<Categories />} />
        <Route path="cities" element={<Cities />} />
        <Route path="channels" element={<Channels />} />
        <Route path="telegram" element={<Telegram />} />
        <Route path="branding" element={<Branding />} />
        <Route path="publications" element={<Publications />} />
        <Route path="payments" element={<Payments />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="managers" element={<Managers />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
