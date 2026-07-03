import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { DataTable } from "../components/ui";
import { api, type PaymentRow } from "../api/client";

export function Payments() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  useEffect(() => { api.payments().then((r) => setRows(r.data)).catch(() => {}); }, []);

  return (
    <div className="page">
      <PageHeader title="Платежі" subtitle="Історія транзакцій платформи" />
      <DataTable empty="Немає платежів" isEmpty={rows.length === 0} minWidth={480}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Сума</th>
              <th>Метод</th>
              <th>Статус</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td data-label="Сума">{r.amount.toLocaleString("uk-UA")} ₴</td>
                <td data-label="Метод">{r.method}</td>
                <td data-label="Статус"><span className="badge">{r.status}</span></td>
                <td data-label="Дата">{new Date(r.createdAt).toLocaleDateString("uk-UA")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
