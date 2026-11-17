import { useMemo, useState, type ReactNode } from "react";
import "./Table.css";

export interface Column<T> {
  key: string;
  header: string;
  align?: "start" | "end";
  render: (row: T) => ReactNode;
  /** Present when the column is sortable. */
  sortValue?: (row: T) => string | number;
}

type Sort = { key: string; dir: "ascending" | "descending" } | null;

interface TableProps<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** The first column is a row header (<th scope="row">). */
  empty?: ReactNode;
}

export function Table<T>({ caption, columns, rows, rowKey, empty }: TableProps<T>) {
  const [sort, setSort] = useState<Sort>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const v = col.sortValue;
    const out = [...rows].sort((a, b) => {
      const x = v(a), y = v(b);
      return typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
    });
    return sort.dir === "descending" ? out.reverse() : out;
  }, [rows, columns, sort]);

  const toggle = (key: string) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "ascending" ? "descending" : "ascending" } : { key, dir: "ascending" }));

  return (
    <table className="nb-table">
      <caption className="visually-hidden">{caption}{sort ? `, sorted by ${columns.find((c) => c.key === sort.key)?.header} ${sort.dir}` : ""}</caption>
      <TableHeader columns={columns} sort={sort} onSort={toggle} />
      <tbody>
        {sorted.map((row) => <TableRow key={rowKey(row)} columns={columns} row={row} />)}
        {sorted.length === 0 && (
          <tr><td className="nb-table__empty" colSpan={columns.length}>{empty ?? "No rows."}</td></tr>
        )}
      </tbody>
    </table>
  );
}

export function TableHeader<T>({ columns, sort, onSort }: { columns: Column<T>[]; sort: Sort; onSort: (key: string) => void }) {
  return (
    <thead>
      <tr>
        {columns.map((c) => {
          const active = sort?.key === c.key;
          return (
            <th key={c.key} scope="col" className={c.align === "end" ? "is-end" : undefined} aria-sort={active ? sort!.dir : c.sortValue ? "none" : undefined}>
              {c.sortValue ? (
                <button type="button" className="nb-table__sort" onClick={() => onSort(c.key)}>
                  {c.header}
                  <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false" data-dir={active ? sort!.dir : "none"}>
                    <path className="up" d="M3 5l3-3 3 3" />
                    <path className="down" d="M3 7l3 3 3-3" />
                  </svg>
                </button>
              ) : c.header}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

export function TableRow<T>({ columns, row }: { columns: Column<T>[]; row: T }) {
  return (
    <tr>
      {columns.map((c, i) =>
        i === 0 ? (
          <th key={c.key} scope="row">{c.render(row)}</th>
        ) : (
          <td key={c.key} className={c.align === "end" ? "is-end" : undefined}>{c.render(row)}</td>
        ),
      )}
    </tr>
  );
}
