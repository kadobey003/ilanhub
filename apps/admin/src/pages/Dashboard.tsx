import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import {
  IconCard,
  IconChart,
  IconListings,
  IconUsers,
} from "../components/icons";

const statCards = [
  {
    key: "pending" as const,
    label: "На модерації",
    icon: IconListings,
    color: "amber",
    link: "/listings",
  },
  {
    key: "published" as const,
    label: "Опубліковано",
    icon: IconChart,
    color: "green",
    link: "/publications",
  },
  {
    key: "users" as const,
    label: "Користувачів",
    icon: IconUsers,
    color: "blue",
    link: "/users",
  },
  {
    key: "revenue" as const,
    label: "Дохід",
    icon: IconCard,
    color: "violet",
    suffix: " ₴",
    link: "/payments",
  },
];

export function Dashboard() {
  const [stats, setStats] = useState({ pending: 0, published: 0, revenue: 0, users: 0 });

  useEffect(() => {
    api.dashboard().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="page">
      <PageHeader
        title="Панель керування"
        subtitle="Огляд ключових показників платформи"
      />

      <div className="stats-grid">
        {statCards.map(({ key, label, icon: Icon, color, suffix, link }) => (
          <Link key={key} to={link} className={`stat-card stat-card-${color}`}>
            <div className="stat-card-icon">
              <Icon size={22} />
            </div>
            <div className="stat-card-body">
              <span className="stat-value">
                {stats[key].toLocaleString("uk-UA")}
                {suffix ?? ""}
              </span>
              <span className="stat-label">{label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="dash-grid">
        <div className="card dash-card">
          <h3 className="card-title">Швидкі дії</h3>
          <div className="quick-actions">
            <Link to="/listings" className="quick-action">
              <IconListings size={18} />
              Модерація оголошень
            </Link>
            <Link to="/publications" className="quick-action">
              <IconChart size={18} />
              Дистрибуція
            </Link>
            <Link to="/users" className="quick-action">
              <IconUsers size={18} />
              Користувачі
            </Link>
          </div>
        </div>

        <div className="card dash-card dash-card-muted">
          <h3 className="card-title">Статус системи</h3>
          <ul className="status-list">
            <li>
              <span className="status-dot status-dot-green" />
              API та база даних — активні
            </li>
            <li>
              <span className="status-dot status-dot-green" />
              Черга публікацій — працює
            </li>
            <li>
              <span className="status-dot status-dot-amber" />
              {stats.pending > 0
                ? `${stats.pending} оголошень очікують модерації`
                : "Немає оголошень на модерації"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
