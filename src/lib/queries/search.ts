"use server";

import { prisma } from "@/lib/prisma";

export type SearchResult = { id: string; label: string; sublabel: string; href: string };
export type SearchResults = { leads: SearchResult[]; customers: SearchResult[]; units: SearchResult[] };

const EMPTY: SearchResults = { leads: [], customers: [], units: [] };

// Global header search (previously a decorative input with no backend at all). Simple
// contains/insensitive match across the fields a rep would actually type — a name, phone,
// email, or unit number — capped at 5 per category so the dropdown stays scannable.
export async function globalSearch(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (q.length < 2) return EMPTY;

  const [leads, customers, units] = await Promise.all([
    prisma.lead.findMany({
      where: {
        deletedAt: null,
        customer: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      },
      take: 5,
      select: { id: true, status: true, customer: { select: { firstName: true, lastName: true, phone: true } } },
    }),
    prisma.customer.findMany({
      where: {
        deletedAt: null,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, firstName: true, lastName: true, phone: true },
    }),
    prisma.unit.findMany({
      where: { deletedAt: null, unitNumber: { contains: q, mode: "insensitive" } },
      take: 5,
      select: { id: true, unitNumber: true, status: true, development: { select: { name: true } } },
    }),
  ]);

  return {
    leads: leads.map((l) => ({
      id: l.id,
      label: `${l.customer.firstName} ${l.customer.lastName}`,
      sublabel: `Lead · ${l.status} · ${l.customer.phone}`,
      href: `/leads/${l.id}`,
    })),
    customers: customers.map((c) => ({
      id: c.id,
      label: `${c.firstName} ${c.lastName}`,
      sublabel: `Customer · ${c.phone}`,
      href: `/customers/${c.id}`,
    })),
    units: units.map((u) => ({
      id: u.id,
      label: u.unitNumber,
      sublabel: `Unit · ${u.development.name} · ${u.status}`,
      href: `/projects`,
    })),
  };
}
