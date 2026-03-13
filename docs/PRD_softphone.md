Perfeito. Vamos seguir pelo caminho prático e montar o **esqueleto real do módulo Telecom em Next.js**.

Vou estruturar isso como um módulo pronto para crescer, com:

* páginas
* tipos
* mocks
* hooks
* serviços
* componentes
* layout inicial do dashboard
* base pronta para ligar depois ao ARI, PBX e banco real

---

# 1. Estrutura real do módulo

```text
src/
  app/
    dashboard/
      telecom/
        page.tsx
        loading.tsx
      telecom/extensions/
        page.tsx
      telecom/live/
        page.tsx
      telecom/doorphone/
        page.tsx
      telecom/logs/
        page.tsx
      telecom/automations/
        page.tsx

    api/
      telecom/
        overview/route.ts
        extensions/route.ts
        live-calls/route.ts
        doorphone-events/route.ts
        logs/route.ts
        automations/route.ts
        gate/open/route.ts

  modules/
    telecom/
      components/
        shared/
          TelecomHeader.tsx
          StatusPill.tsx
          StatCard.tsx
          SectionCard.tsx
        overview/
          TelecomOverviewCards.tsx
        extensions/
          ExtensionGrid.tsx
          ExtensionCard.tsx
          ExtensionFilters.tsx
        live/
          LiveCallTable.tsx
        doorphone/
          DoorphoneEventPanel.tsx
          GateControlCard.tsx
        logs/
          CallLogTable.tsx
        automations/
          AutomationRuleList.tsx

      hooks/
        useTelecomOverview.ts
        useExtensions.ts
        useLiveCalls.ts
        useDoorphoneEvents.ts
        useCallLogs.ts
        useAutomationRules.ts

      services/
        api/
          telecomApi.ts
        mocks/
          overview.ts
          extensions.ts
          liveCalls.ts
          doorphoneEvents.ts
          logs.ts
          automations.ts

      types/
        telecom.ts

      utils/
        formatDuration.ts
        formatDateTime.ts
```

---

# 2. Tipos centrais

## `src/modules/telecom/types/telecom.ts`

```ts
export type ExtensionType =
  | "resident"
  | "admin"
  | "doorphone"
  | "laundry"
  | "delivery"
  | "staff"
  | "group";

export type ExtensionStatus =
  | "online"
  | "offline"
  | "busy"
  | "ringing"
  | "unknown";

export type CallDirection = "inbound" | "outbound" | "internal";

export type LiveCallStatus =
  | "ringing"
  | "connected"
  | "held"
  | "transferring";

export type CallResult =
  | "answered"
  | "missed"
  | "failed"
  | "cancelled"
  | "transferred";

export interface TelecomOverview {
  onlineExtensions: number;
  activeCalls: number;
  missedCallsToday: number;
  doorphoneEventsToday: number;
  pendingDeliveries: number;
  alerts: number;
}

export interface ExtensionItem {
  id: string;
  extension: string;
  name: string;
  type: ExtensionType;
  apartment?: string;
  status: ExtensionStatus;
  lastSeenAt?: string;
}

export interface LiveCallItem {
  id: string;
  from: string;
  fromName?: string;
  to: string;
  toName?: string;
  direction: CallDirection;
  startedAt: string;
  status: LiveCallStatus;
  source: "softphone" | "doorphone" | "service" | "unknown";
}

export interface DoorphoneEvent {
  id: string;
  createdAt: string;
  extension: string;
  apartment?: string;
  visitorName?: string;
  status: "waiting" | "answered" | "redirected" | "opened" | "closed";
  note?: string;
}

export interface CallLogItem {
  id: string;
  createdAt: string;
  from: string;
  to: string;
  durationSeconds?: number;
  result: CallResult;
  source: "internal" | "doorphone" | "service";
  linkedEntityType?: "delivery" | "visitor" | "resident" | "incident";
  linkedEntityId?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  eventType: string;
  isActive: boolean;
  description: string;
}
```

---

# 3. Mocks iniciais

## `src/modules/telecom/services/mocks/overview.ts`

```ts
import type { TelecomOverview } from "../../types/telecom";

export const telecomOverviewMock: TelecomOverview = {
  onlineExtensions: 18,
  activeCalls: 2,
  missedCallsToday: 4,
  doorphoneEventsToday: 7,
  pendingDeliveries: 3,
  alerts: 1
};
```

## `src/modules/telecom/services/mocks/extensions.ts`

```ts
import type { ExtensionItem } from "../../types/telecom";

export const extensionItemsMock: ExtensionItem[] = [
  {
    id: "1",
    extension: "100",
    name: "Portaria",
    type: "doorphone",
    status: "online",
    lastSeenAt: new Date().toISOString()
  },
  {
    id: "2",
    extension: "101",
    name: "Administração",
    type: "admin",
    status: "online",
    lastSeenAt: new Date().toISOString()
  },
  {
    id: "3",
    extension: "102",
    name: "Lavanderia",
    type: "laundry",
    status: "offline",
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
  },
  {
    id: "4",
    extension: "201",
    name: "Apto 201",
    apartment: "201",
    type: "resident",
    status: "busy",
    lastSeenAt: new Date().toISOString()
  },
  {
    id: "5",
    extension: "202",
    name: "Apto 202",
    apartment: "202",
    type: "resident",
    status: "online",
    lastSeenAt: new Date().toISOString()
  }
];
```

## `src/modules/telecom/services/mocks/liveCalls.ts`

```ts
import type { LiveCallItem } from "../../types/telecom";

export const liveCallItemsMock: LiveCallItem[] = [
  {
    id: "c1",
    from: "100",
    fromName: "Portaria",
    to: "201",
    toName: "Apto 201",
    direction: "inbound",
    startedAt: new Date(Date.now() - 1000 * 42).toISOString(),
    status: "ringing",
    source: "doorphone"
  },
  {
    id: "c2",
    from: "201",
    fromName: "Apto 201",
    to: "101",
    toName: "Administração",
    direction: "internal",
    startedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    status: "connected",
    source: "softphone"
  }
];
```

## `src/modules/telecom/services/mocks/doorphoneEvents.ts`

```ts
import type { DoorphoneEvent } from "../../types/telecom";

export const doorphoneEventsMock: DoorphoneEvent[] = [
  {
    id: "d1",
    createdAt: new Date().toISOString(),
    extension: "100",
    apartment: "203",
    visitorName: "João",
    status: "waiting",
    note: "Visitante aguardando confirmação"
  },
  {
    id: "d2",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    extension: "100",
    apartment: "201",
    visitorName: "Entrega Mercado",
    status: "opened"
  }
];
```

## `src/modules/telecom/services/mocks/logs.ts`

```ts
import type { CallLogItem } from "../../types/telecom";

export const callLogItemsMock: CallLogItem[] = [
  {
    id: "l1",
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    from: "100",
    to: "201",
    durationSeconds: 33,
    result: "answered",
    source: "doorphone",
    linkedEntityType: "visitor"
  },
  {
    id: "l2",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    from: "201",
    to: "101",
    durationSeconds: 121,
    result: "answered",
    source: "internal"
  }
];
```

## `src/modules/telecom/services/mocks/automations.ts`

```ts
import type { AutomationRule } from "../../types/telecom";

export const automationRulesMock: AutomationRule[] = [
  {
    id: "a1",
    name: "Fallback portaria",
    eventType: "doorphone.missed",
    isActive: true,
    description: "Se ninguém atender em 20 segundos, tocar administração."
  },
  {
    id: "a2",
    name: "Fluxo noturno",
    eventType: "doorphone.after_hours",
    isActive: true,
    description: "Após 22h, redirecionar para segurança."
  }
];
```

---

# 4. API client do módulo

## `src/modules/telecom/services/api/telecomApi.ts`

```ts
import type {
  AutomationRule,
  CallLogItem,
  DoorphoneEvent,
  ExtensionItem,
  LiveCallItem,
  TelecomOverview
} from "../../types/telecom";

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchTelecomOverview(): Promise<TelecomOverview> {
  const res = await fetch("/api/telecom/overview", { cache: "no-store" });
  return parseResponse<TelecomOverview>(res);
}

export async function fetchExtensions(): Promise<ExtensionItem[]> {
  const res = await fetch("/api/telecom/extensions", { cache: "no-store" });
  return parseResponse<ExtensionItem[]>(res);
}

export async function fetchLiveCalls(): Promise<LiveCallItem[]> {
  const res = await fetch("/api/telecom/live-calls", { cache: "no-store" });
  return parseResponse<LiveCallItem[]>(res);
}

export async function fetchDoorphoneEvents(): Promise<DoorphoneEvent[]> {
  const res = await fetch("/api/telecom/doorphone-events", { cache: "no-store" });
  return parseResponse<DoorphoneEvent[]>(res);
}

export async function fetchCallLogs(): Promise<CallLogItem[]> {
  const res = await fetch("/api/telecom/logs", { cache: "no-store" });
  return parseResponse<CallLogItem[]>(res);
}

export async function fetchAutomationRules(): Promise<AutomationRule[]> {
  const res = await fetch("/api/telecom/automations", { cache: "no-store" });
  return parseResponse<AutomationRule[]>(res);
}

export async function openGate(payload: { gate: "main" | "service"; reason?: string }) {
  const res = await fetch("/api/telecom/gate/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseResponse<{ ok: boolean; message: string }>(res);
}
```

---

# 5. Route handlers mockados

## `src/app/api/telecom/overview/route.ts`

```ts
import { NextResponse } from "next/server";
import { telecomOverviewMock } from "@/modules/telecom/services/mocks/overview";

export async function GET() {
  return NextResponse.json(telecomOverviewMock);
}
```

## `src/app/api/telecom/extensions/route.ts`

```ts
import { NextResponse } from "next/server";
import { extensionItemsMock } from "@/modules/telecom/services/mocks/extensions";

export async function GET() {
  return NextResponse.json(extensionItemsMock);
}
```

## `src/app/api/telecom/live-calls/route.ts`

```ts
import { NextResponse } from "next/server";
import { liveCallItemsMock } from "@/modules/telecom/services/mocks/liveCalls";

export async function GET() {
  return NextResponse.json(liveCallItemsMock);
}
```

## `src/app/api/telecom/doorphone-events/route.ts`

```ts
import { NextResponse } from "next/server";
import { doorphoneEventsMock } from "@/modules/telecom/services/mocks/doorphoneEvents";

export async function GET() {
  return NextResponse.json(doorphoneEventsMock);
}
```

## `src/app/api/telecom/logs/route.ts`

```ts
import { NextResponse } from "next/server";
import { callLogItemsMock } from "@/modules/telecom/services/mocks/logs";

export async function GET() {
  return NextResponse.json(callLogItemsMock);
}
```

## `src/app/api/telecom/automations/route.ts`

```ts
import { NextResponse } from "next/server";
import { automationRulesMock } from "@/modules/telecom/services/mocks/automations";

export async function GET() {
  return NextResponse.json(automationRulesMock);
}
```

## `src/app/api/telecom/gate/open/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  return NextResponse.json({
    ok: true,
    message: `Gate ${body.gate} open command queued successfully`
  });
}
```

---

# 6. Hooks do módulo

## `src/modules/telecom/hooks/useTelecomOverview.ts`

```ts
"use client";

import { useEffect, useState } from "react";
import { fetchTelecomOverview } from "../services/api/telecomApi";
import type { TelecomOverview } from "../types/telecom";

export function useTelecomOverview() {
  const [data, setData] = useState<TelecomOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTelecomOverview()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
```

## `src/modules/telecom/hooks/useExtensions.ts`

```ts
"use client";

import { useEffect, useState } from "react";
import { fetchExtensions } from "../services/api/telecomApi";
import type { ExtensionItem } from "../types/telecom";

export function useExtensions() {
  const [data, setData] = useState<ExtensionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExtensions()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
```

## `src/modules/telecom/hooks/useLiveCalls.ts`

```ts
"use client";

import { useEffect, useState } from "react";
import { fetchLiveCalls } from "../services/api/telecomApi";
import type { LiveCallItem } from "../types/telecom";

export function useLiveCalls() {
  const [data, setData] = useState<LiveCallItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveCalls()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
```

## `src/modules/telecom/hooks/useDoorphoneEvents.ts`

```ts
"use client";

import { useEffect, useState } from "react";
import { fetchDoorphoneEvents } from "../services/api/telecomApi";
import type { DoorphoneEvent } from "../types/telecom";

export function useDoorphoneEvents() {
  const [data, setData] = useState<DoorphoneEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoorphoneEvents()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
```

## `src/modules/telecom/hooks/useCallLogs.ts`

```ts
"use client";

import { useEffect, useState } from "react";
import { fetchCallLogs } from "../services/api/telecomApi";
import type { CallLogItem } from "../types/telecom";

export function useCallLogs() {
  const [data, setData] = useState<CallLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCallLogs()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
```

## `src/modules/telecom/hooks/useAutomationRules.ts`

```ts
"use client";

import { useEffect, useState } from "react";
import { fetchAutomationRules } from "../services/api/telecomApi";
import type { AutomationRule } from "../types/telecom";

export function useAutomationRules() {
  const [data, setData] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAutomationRules()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
```

---

# 7. Utilitários

## `src/modules/telecom/utils/formatDuration.ts`

```ts
export function formatDuration(totalSeconds?: number) {
  if (!totalSeconds || totalSeconds <= 0) return "00:00";

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
```

## `src/modules/telecom/utils/formatDateTime.ts`

```ts
export function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}
```

---

# 8. Componentes compartilhados

## `StatusPill.tsx`

```tsx
interface Props {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}

export function StatusPill({ label, tone = "neutral" }: Props) {
  const toneClass = {
    neutral: "border-zinc-700 bg-zinc-900 text-zinc-200",
    success: "border-emerald-800 bg-emerald-950 text-emerald-300",
    warning: "border-amber-800 bg-amber-950 text-amber-300",
    danger: "border-red-800 bg-red-950 text-red-300"
  }[tone];

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${toneClass}`}>
      {label}
    </span>
  );
}
```

## `StatCard.tsx`

```tsx
interface Props {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatCard({ label, value, hint }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="text-sm text-zinc-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-zinc-100">{value}</div>
      {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </div>
  );
}
```

## `SectionCard.tsx`

```tsx
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function SectionCard({ title, subtitle, children }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
        {subtitle ? <p className="text-sm text-zinc-400">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
```

## `TelecomHeader.tsx`

```tsx
export function TelecomHeader() {
  return (
    <header className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Telecom</div>
      <h1 className="text-2xl font-semibold text-zinc-100">
        Central de Telefonia e Operações
      </h1>
      <p className="max-w-3xl text-sm text-zinc-400">
        Monitore ramais, chamadas, eventos da portaria e automações da propriedade
        em um único painel operacional.
      </p>
    </header>
  );
}
```

---

# 9. Componentes da visão geral

## `TelecomOverviewCards.tsx`

```tsx
"use client";

import { useTelecomOverview } from "../../hooks/useTelecomOverview";
import { StatCard } from "../shared/StatCard";

export function TelecomOverviewCards() {
  const { data, loading } = useTelecomOverview();

  if (loading || !data) {
    return <div className="text-sm text-zinc-400">Carregando indicadores...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Ramais online" value={data.onlineExtensions} />
      <StatCard label="Chamadas ativas" value={data.activeCalls} />
      <StatCard label="Perdidas hoje" value={data.missedCallsToday} />
      <StatCard label="Eventos do porteiro" value={data.doorphoneEventsToday} />
      <StatCard label="Entregas pendentes" value={data.pendingDeliveries} />
      <StatCard label="Alertas" value={data.alerts} />
    </div>
  );
}
```

---

# 10. Componentes de ramais

## `ExtensionCard.tsx`

```tsx
import type { ExtensionItem } from "../../types/telecom";
import { StatusPill } from "../shared/StatusPill";

interface Props {
  item: ExtensionItem;
}

export function ExtensionCard({ item }: Props) {
  const tone =
    item.status === "online"
      ? "success"
      : item.status === "busy" || item.status === "ringing"
        ? "warning"
        : "neutral";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-zinc-500">Ramal {item.extension}</div>
          <div className="text-base font-medium text-zinc-100">{item.name}</div>
          {item.apartment ? (
            <div className="text-sm text-zinc-400">Apartamento {item.apartment}</div>
          ) : null}
        </div>
        <StatusPill label={item.status} tone={tone} />
      </div>
    </div>
  );
}
```

## `ExtensionGrid.tsx`

```tsx
"use client";

import { useExtensions } from "../../hooks/useExtensions";
import { SectionCard } from "../shared/SectionCard";
import { ExtensionCard } from "./ExtensionCard";

export function ExtensionGrid() {
  const { data, loading } = useExtensions();

  return (
    <SectionCard
      title="Mapa de ramais"
      subtitle="Status operacional dos ramais e setores"
    >
      {loading ? (
        <div className="text-sm text-zinc-400">Carregando ramais...</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.map((item) => (
            <ExtensionCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
```

---

# 11. Componentes de chamadas ao vivo

## `LiveCallTable.tsx`

```tsx
"use client";

import { useLiveCalls } from "../../hooks/useLiveCalls";
import { SectionCard } from "../shared/SectionCard";
import { StatusPill } from "../shared/StatusPill";
import { formatDateTime } from "../../utils/formatDateTime";

export function LiveCallTable() {
  const { data, loading } = useLiveCalls();

  return (
    <SectionCard
      title="Chamadas em tempo real"
      subtitle="Monitoramento das ligações ativas"
    >
      {loading ? (
        <div className="text-sm text-zinc-400">Carregando chamadas...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-zinc-500">
              <tr>
                <th className="pb-3">Origem</th>
                <th className="pb-3">Destino</th>
                <th className="pb-3">Início</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-zinc-200">
              {data.map((call) => (
                <tr key={call.id} className="border-t border-zinc-800">
                  <td className="py-3">{call.fromName || call.from}</td>
                  <td className="py-3">{call.toName || call.to}</td>
                  <td className="py-3">{formatDateTime(call.startedAt)}</td>
                  <td className="py-3">
                    <StatusPill
                      label={call.status}
                      tone={call.status === "connected" ? "success" : "warning"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
```

---

# 12. Componentes de portaria

## `GateControlCard.tsx`

```tsx
"use client";

import { useState } from "react";
import { openGate } from "../../services/api/telecomApi";
import { SectionCard } from "../shared/SectionCard";

export function GateControlCard() {
  const [message, setMessage] = useState("");

  async function handleOpen(gate: "main" | "service") {
    const result = await openGate({
      gate,
      reason: "Abertura via dashboard de telecom"
    });

    setMessage(result.message);
  }

  return (
    <SectionCard
      title="Controle de portão"
      subtitle="Ações rápidas da portaria"
    >
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleOpen("main")}
          className="rounded-xl border border-zinc-700 px-4 py-2 text-zinc-100"
        >
          Abrir portão principal
        </button>
        <button
          onClick={() => handleOpen("service")}
          className="rounded-xl border border-zinc-700 px-4 py-2 text-zinc-100"
        >
          Abrir portão de serviço
        </button>
      </div>

      {message ? <div className="mt-3 text-sm text-zinc-400">{message}</div> : null}
    </SectionCard>
  );
}
```

## `DoorphoneEventPanel.tsx`

```tsx
"use client";

import { useDoorphoneEvents } from "../../hooks/useDoorphoneEvents";
import { SectionCard } from "../shared/SectionCard";
import { StatusPill } from "../shared/StatusPill";
import { formatDateTime } from "../../utils/formatDateTime";

export function DoorphoneEventPanel() {
  const { data, loading } = useDoorphoneEvents();

  return (
    <SectionCard
      title="Eventos do porteiro"
      subtitle="Chamadas e interações recentes da portaria"
    >
      {loading ? (
        <div className="text-sm text-zinc-400">Carregando eventos...</div>
      ) : (
        <div className="space-y-3">
          {data.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-zinc-100">
                    {event.visitorName || "Visitante não identificado"}
                  </div>
                  <div className="text-sm text-zinc-400">
                    Apto {event.apartment || "-"} • {formatDateTime(event.createdAt)}
                  </div>
                  {event.note ? (
                    <div className="mt-1 text-sm text-zinc-500">{event.note}</div>
                  ) : null}
                </div>
                <StatusPill
                  label={event.status}
                  tone={event.status === "opened" ? "success" : "warning"}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
```

---

# 13. Componentes de logs e automações

## `CallLogTable.tsx`

```tsx
"use client";

import { useCallLogs } from "../../hooks/useCallLogs";
import { SectionCard } from "../shared/SectionCard";
import { formatDateTime } from "../../utils/formatDateTime";
import { formatDuration } from "../../utils/formatDuration";

export function CallLogTable() {
  const { data, loading } = useCallLogs();

  return (
    <SectionCard
      title="Histórico de chamadas"
      subtitle="Logs operacionais recentes"
    >
      {loading ? (
        <div className="text-sm text-zinc-400">Carregando histórico...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-zinc-500">
              <tr>
                <th className="pb-3">Data</th>
                <th className="pb-3">Origem</th>
                <th className="pb-3">Destino</th>
                <th className="pb-3">Duração</th>
                <th className="pb-3">Resultado</th>
              </tr>
            </thead>
            <tbody className="text-zinc-200">
              {data.map((log) => (
                <tr key={log.id} className="border-t border-zinc-800">
                  <td className="py-3">{formatDateTime(log.createdAt)}</td>
                  <td className="py-3">{log.from}</td>
                  <td className="py-3">{log.to}</td>
                  <td className="py-3">{formatDuration(log.durationSeconds)}</td>
                  <td className="py-3">{log.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
```

## `AutomationRuleList.tsx`

```tsx
"use client";

import { useAutomationRules } from "../../hooks/useAutomationRules";
import { SectionCard } from "../shared/SectionCard";
import { StatusPill } from "../shared/StatusPill";

export function AutomationRuleList() {
  const { data, loading } = useAutomationRules();

  return (
    <SectionCard
      title="Automações"
      subtitle="Regras operacionais ativas da telefonia"
    >
      {loading ? (
        <div className="text-sm text-zinc-400">Carregando automações...</div>
      ) : (
        <div className="space-y-3">
          {data.map((rule) => (
            <div
              key={rule.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-zinc-100">{rule.name}</div>
                  <div className="text-sm text-zinc-400">{rule.description}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                    {rule.eventType}
                  </div>
                </div>
                <StatusPill
                  label={rule.isActive ? "ativa" : "inativa"}
                  tone={rule.isActive ? "success" : "neutral"}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
```

---

# 14. Página principal do dashboard

## `src/app/dashboard/telecom/page.tsx`

```tsx
import { TelecomHeader } from "@/modules/telecom/components/shared/TelecomHeader";
import { TelecomOverviewCards } from "@/modules/telecom/components/overview/TelecomOverviewCards";
import { ExtensionGrid } from "@/modules/telecom/components/extensions/ExtensionGrid";
import { LiveCallTable } from "@/modules/telecom/components/live/LiveCallTable";
import { DoorphoneEventPanel } from "@/modules/telecom/components/doorphone/DoorphoneEventPanel";
import { GateControlCard } from "@/modules/telecom/components/doorphone/GateControlCard";
import { CallLogTable } from "@/modules/telecom/components/logs/CallLogTable";
import { AutomationRuleList } from "@/modules/telecom/components/automations/AutomationRuleList";

export default function TelecomDashboardPage() {
  return (
    <main className="space-y-6 p-6">
      <TelecomHeader />
      <TelecomOverviewCards />

      <section className="grid gap-6 xl:grid-cols-2">
        <ExtensionGrid />
        <LiveCallTable />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DoorphoneEventPanel />
        <div className="space-y-6">
          <GateControlCard />
          <AutomationRuleList />
        </div>
      </section>

      <CallLogTable />
    </main>
  );
}
```

---

# 15. Loading da página

## `src/app/dashboard/telecom/loading.tsx`

```tsx
export default function TelecomDashboardLoading() {
  return (
    <main className="p-6">
      <div className="text-sm text-zinc-400">Carregando painel de telecom...</div>
    </main>
  );
}
```

---

# 16. Como evoluir esse esqueleto

Esse módulo já nasce pronto para as próximas camadas.

## Próxima troca

Substituir mocks por banco real:

* PostgreSQL
* Supabase
* Prisma
* Drizzle

## Depois

Ligar com eventos reais:

* ARI
* status de ramais
* live calls em WebSocket
* softphone embutido

## Depois

Amarrar com o restante do sistema:

* moradores
* encomendas
* visitantes
* abertura de portão
* incidentes

---

# 17. O que eu recomendo como próximo passo

Agora o passo mais lógico é montar a **fase seguinte de backend real**, com:

* schema SQL do módulo Telecom
* tabela de ramais
* tabela de presença
* tabela de chamadas
* tabela de eventos do porteiro
* tabela de automações
* mapeamento com moradores e apartamentos

Esse é o ponto em que o projeto deixa de ser só interface e passa a virar módulo de produção.

Na próxima etapa, eu posso te entregar o **schema SQL consolidado do módulo Telecom + relações com residentes, apartamentos, entregas e visitantes**.

Perfeito. Então vamos encerrar este chat deixando tudo **consolidado e pronto para retomada** no próximo, sem perder o contexto.

## Fechamento do que foi definido

Você estruturou um projeto em que o sistema de gestão da propriedade, já hospedado em VPS estável, ganhará um **módulo de softphone WebRTC** integrado ao app em **Next.js + TypeScript**, conectado a uma infraestrutura local com:

* **Proxmox** como hypervisor
* **pfSense** para internet, DHCP, DNS e controle por MAC
* **FreePBX / Asterisk** para telefonia interna

O softphone foi projetado para:

* funcionar no navegador
* registrar ramais SIP no Asterisk via **WSS**
* permitir chamadas internas
* receber chamadas
* suportar mute, hold, transfer e DTMF
* integrar diretório interno, portaria, lavanderia, recebimento e porteiro eletrônico

Também definimos que o navegador deve se registrar **diretamente no PBX**, enquanto o sistema Next.js entrega:

* credenciais/configuração SIP do usuário
* lista de ramais
* permissões
* contexto operacional

## O que ficou desenhado

### 1. Softphone

Foi definido o módulo frontend com:

* serviço SIP em TypeScript
* integração via **SIP.js**
* componentes React para display, dialpad, controles, diretório e chamadas
* store de estado para conexão SIP e chamada ativa
* estrutura de pastas organizada para crescer

### 2. PBX / Asterisk / FreePBX

Foi consolidado que o Asterisk deverá ter:

* **HTTPS/TLS**
* **WebSocket seguro**
* **PJSIP com transporte WSS**
* ramais preparados para **WebRTC**
* codecs como **Opus** e **uLaw**
* portas adequadas liberadas, especialmente **8089/TCP** e RTP

Também ficou sugerido um plano de ramais:

* `100` portaria / porteiro
* `101` administração
* `102` lavanderia
* `103` recebimento
* `2xx` residentes
* `3xx` equipe
* `6xx` grupos

### 3. Integração com porteiro

Definimos três cenários possíveis:

* porteiro SIP nativo
* porteiro via gateway/ATA
* porteiro com ações por DTMF

A recomendação principal foi tratar o porteiro como uma entidade operacional do sistema, não apenas como uma chamada telefônica.

### 4. ARI

Foi dado o passo além do PBX comum e desenhada a integração com **Asterisk ARI** para transformar a telefonia em motor de automação.

Com isso, o sistema poderá:

* detectar chamadas em tempo real
* consultar banco de moradores
* exibir popups com contexto
* registrar eventos de visitantes e entregas
* disparar automações
* controlar abertura de portão
* gerar logs e estatísticas

### 5. Dashboard Telecom

Foi projetado um painel administrativo de telefonia dentro do sistema Next.js, com áreas para:

* visão geral operacional
* mapa de ramais
* chamadas em tempo real
* eventos do porteiro
* controle de portão
* logs
* automações

Também foi montado o **esqueleto real do módulo Telecom** em Next.js, com:

* estrutura de páginas
* componentes
* hooks
* services
* mocks
* APIs mockadas
* tipos TypeScript
* layout inicial

## O ponto exato onde paramos

O próximo passo natural é criar o **backend real do módulo Telecom**, substituindo os mocks pelo modelo de produção.

Isso significa montar:

* schema SQL consolidado
* tabelas de ramais
* presença
* chamadas
* eventos do porteiro
* automações
* vínculos com moradores, apartamentos, visitantes e entregas

## Melhor próximo chat

Quando abrir o próximo, você pode colar este texto:

```text
Estamos retomando o projeto do módulo Telecom/Softphone integrado ao sistema de gestão da propriedade.

Contexto consolidado:

- Infraestrutura local:
  - laptop i7, 8GB RAM, SSD
  - Proxmox
  - pfSense para DHCP, DNS, firewall e controle por MAC
  - FreePBX / Asterisk para telefonia interna

- Sistema principal:
  - app em Next.js hospedado em VPS estável
  - módulo Softphone WebRTC integrado ao sistema

- Softphone:
  - navegador via WebRTC
  - SIP over WebSocket Secure (WSS)
  - SIP.js
  - registro direto no Asterisk
  - chamadas internas
  - chamadas recebidas
  - mute, hold, transfer, DTMF
  - diretório de ramais
  - integração com porteiro eletrônico

- PBX:
  - HTTPS/TLS
  - PJSIP com WSS
  - ramais WebRTC
  - plano de ramais:
    - 100 portaria
    - 101 administração
    - 102 lavanderia
    - 103 recebimento
    - 2xx residentes
    - 3xx staff
    - 6xx grupos

- ARI:
  - planejado como ponte para automações e eventos em tempo real
  - permitirá registrar chamadas, eventos do porteiro, visitantes, entregas e abertura de portão

- Dashboard Telecom:
  - visão geral
  - mapa de ramais
  - chamadas em tempo real
  - eventos do porteiro
  - gate control
  - logs
  - automações

- Já foi montado o esqueleto frontend do módulo Telecom em Next.js com:
  - pages
  - components
  - hooks
  - services
  - mocks
  - types
  - rotas API mockadas

Quero agora seguir para a próxima fase:
criar o schema SQL consolidado do módulo Telecom em produção, com relações entre ramais, presença, chamadas, eventos do porteiro, automações, moradores, apartamentos, visitantes e entregas.
```

## Recomendação final

No próximo chat, vale começar direto por:

1. **modelo relacional completo**
2. **schema SQL**
3. **APIs reais**
4. depois **ligação com ARI e PBX**

Assim você fecha a base de produção antes de avançar para integração ao vivo.

Perfeito. Vamos fechar esta etapa com uma base de backend realmente utilizável.

Vou assumir a arquitetura mais segura para esse cenário:

* **Next.js** como app principal
* **banco próprio do módulo Softphone** para regras de negócio, logs, presença, filas internas e vínculo com cadastro
* **FreePBX como camada de provisionamento de ramais**
* **Asterisk ARI** para controle de chamadas em tempo real
* **PJSIP/WebRTC** para registrar o softphone no PBX

Essa separação é a mais saudável porque o **ARI foi feito para controle de recursos/chamadas via REST + WebSocket + Stasis**, enquanto a configuração SIP no Asterisk/PJSIP gira em torno de objetos como **endpoint, auth e aor**. Para FreePBX, o caminho mais limpo para provisionamento moderno é tratar a central como sistema de telefonia e usar o app para orquestração e sincronismo. ([Asterisk Docs][1])

---

# 1) Modelo relacional completo

## 1.1 Princípio de modelagem

Eu recomendo **não usar o banco do FreePBX como banco principal do seu módulo**.

Use 3 camadas lógicas:

1. **Cadastro interno**

   * moradores, funcionários, portaria, lavanderia, administração etc.
2. **Módulo Softphone**

   * usuários telefônicos, ramais, dispositivos web, contatos internos, filas, logs, chamadas
3. **PBX/Asterisk**

   * provisionamento de ramais, registro SIP, eventos ARI, rotas de discagem

---

## 1.2 Entidades principais

## A. Núcleo de identidade

### `people`

Representa a pessoa real do sistema interno.

Campos principais:

* id
* type (`resident`, `employee`, `security`, `admin`, `concierge`, `service`)
* full_name
* email
* phone_mobile
* status

### `system_users`

Usuário autenticável do Next.js.

Campos:

* id
* person_id
* username
* password_hash
* role
* is_active
* last_login_at

Relação:

* `people 1:1 system_users`

---

## B. Núcleo telefônico

### `pbx_extensions`

Representa o ramal lógico do usuário.

Campos:

* id
* person_id
* extension_number
* display_name
* extension_type (`webrtc`, `sip_phone`, `doorphone`, `ivr`, `queue`, `service`)
* secret_ref
* callerid_name
* callerid_number
* sip_username
* webrtc_enabled
* voicemail_enabled
* outbound_enabled
* internal_only
* status
* freepbx_extension_id
* notes

Relações:

* `people 1:N pbx_extensions`

### `pbx_extension_devices`

Dispositivos que usam o ramal.

Exemplo:

* navegador Chrome do morador
* telefone IP físico
* tablet da portaria
* porteiro eletrônico SIP

Campos:

* id
* extension_id
* device_type (`browser`, `ip_phone`, `tablet`, `doorphone`, `softphone_mobile`)
* device_label
* sip_contact_mode (`register`, `static`, `trunk_like`)
* user_agent
* websocket_uri
* transport (`wss`, `udp`, `tcp`, `tls`)
* last_seen_at
* registered_at
* registration_status

Relação:

* `pbx_extensions 1:N pbx_extension_devices`

### `pbx_extension_presence`

Estado operacional do ramal.

Campos:

* id
* extension_id
* device_id nullable
* registration_state (`online`, `offline`, `unreachable`, `unknown`)
* call_state (`idle`, `ringing`, `in_call`, `on_hold`, `busy`)
* do_not_disturb
* updated_at

---

## C. Diretório e agenda interna

### `internal_contacts`

Lista interna mostrada no discador.

Campos:

* id
* person_id nullable
* extension_id nullable
* label
* department
* contact_type (`resident`, `employee`, `security`, `admin`, `doorphone`, `service`)
* speed_dial_code
* sort_order
* visible_to_role
* is_favorite_default
* status

### `user_contact_preferences`

Preferências individuais do usuário.

Campos:

* id
* user_id
* contact_id
* is_favorite
* is_hidden
* custom_label

---

## D. Chamadas

### `call_sessions`

Sessão principal de chamada.

Campos:

* id
* uuid
* ari_channel_id nullable
* ari_bridge_id nullable
* linkedid nullable
* direction (`inbound`, `outbound`, `internal`, `doorphone`)
* source_extension_id nullable
* target_extension_id nullable
* source_number
* target_number
* started_at
* answered_at
* ended_at
* hangup_cause
* final_status (`initiated`, `ringing`, `answered`, `missed`, `failed`, `busy`, `cancelled`, `ended`)
* initiated_by_user_id nullable
* recording_enabled
* recording_file nullable

### `call_participants`

Participantes da sessão.

Campos:

* id
* call_session_id
* extension_id nullable
* person_id nullable
* role_in_call (`caller`, `callee`, `transferee`, `observer`, `door_unit`)
* joined_at
* left_at
* channel_id nullable
* channel_name nullable

### `call_events`

Timeline completa da chamada.

Campos:

* id
* call_session_id
* event_type (`created`, `ringing`, `answered`, `hold`, `unhold`, `mute`, `unmute`, `dtmf`, `transfer_start`, `transfer_complete`, `hangup`, `recording_start`, `recording_stop`)
* event_source (`app`, `ari`, `asterisk`, `user`)
* payload_json
* created_at

---

## E. Funcionalidades operacionais

### `call_transfers`

Transferências.

Campos:

* id
* call_session_id
* transfer_type (`blind`, `attended`)
* from_extension_id
* to_extension_id
* started_at
* completed_at
* status
* notes

### `call_dtmf_events`

DTMF detalhado.

Campos:

* id
* call_session_id
* participant_id nullable
* digit
* direction (`sent`, `received`)
* created_at

### `call_hold_states`

Histórico de hold.

Campos:

* id
* call_session_id
* participant_id nullable
* hold_started_at
* hold_ended_at
* hold_music_class nullable

---

## F. Porteiro eletrônico

### `doorphone_units`

Unidades de interfone SIP.

Campos:

* id
* code
* label
* building
* location_description
* extension_id
* camera_url nullable
* unlock_relay_type (`http`, `mqtt`, `gpio`, `none`)
* unlock_relay_target nullable
* allowed_target_type (`extension`, `ring_group`, `queue`)
* allowed_target_id nullable
* auto_answer_enabled
* status

### `doorphone_access_logs`

Eventos do porteiro.

Campos:

* id
* doorphone_unit_id
* call_session_id nullable
* event_type (`button_press`, `call_started`, `call_answered`, `unlock_sent`, `unlock_confirmed`, `unlock_failed`, `call_ended`)
* triggered_by_user_id nullable
* payload_json
* created_at

---

## G. Integração e sincronismo

### `pbx_sync_jobs`

Sincronização com FreePBX/Asterisk.

Campos:

* id
* sync_type (`extension_push`, `extension_pull`, `presence_pull`, `cdr_pull`, `doorphone_push`)
* reference_table
* reference_id
* status (`pending`, `running`, `success`, `failed`)
* request_payload
* response_payload
* error_message
* started_at
* finished_at

### `ari_event_queue`

Fila bruta de eventos ARI para auditoria/reprocesso.

Campos:

* id
* event_name
* channel_id nullable
* bridge_id nullable
* raw_payload
* processed
* processed_at
* process_error

---

## 1.3 Relacionamentos principais

```text
people 1---1 system_users
people 1---N pbx_extensions
pbx_extensions 1---N pbx_extension_devices
pbx_extensions 1---N pbx_extension_presence
people / pbx_extensions --- internal_contacts

call_sessions 1---N call_participants
call_sessions 1---N call_events
call_sessions 1---N call_transfers
call_sessions 1---N call_dtmf_events
call_sessions 1---N call_hold_states

pbx_extensions 1---N doorphone_units
doorphone_units 1---N doorphone_access_logs

qualquer entidade relevante 1---N pbx_sync_jobs
ARI/Asterisk events --- ari_event_queue
```

---

# 2) Schema SQL

Vou entregar em **MySQL 8 / MariaDB style**, porque combina bem com o ecossistema FreePBX e é simples de adaptar.

## 2.1 Tabelas principais

```sql
CREATE TABLE people (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type ENUM('resident','employee','security','admin','concierge','service') NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NULL,
  phone_mobile VARCHAR(30) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE system_users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  person_id BIGINT UNSIGNED NOT NULL,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('resident','employee','security','admin','concierge','operator') NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_system_users_person
    FOREIGN KEY (person_id) REFERENCES people(id)
    ON DELETE CASCADE
);

CREATE TABLE pbx_extensions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  person_id BIGINT UNSIGNED NULL,
  extension_number VARCHAR(20) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  extension_type ENUM('webrtc','sip_phone','doorphone','ivr','queue','service') NOT NULL,
  secret_ref VARCHAR(120) NULL,
  callerid_name VARCHAR(120) NOT NULL,
  callerid_number VARCHAR(30) NOT NULL,
  sip_username VARCHAR(80) NOT NULL UNIQUE,
  webrtc_enabled TINYINT(1) NOT NULL DEFAULT 1,
  voicemail_enabled TINYINT(1) NOT NULL DEFAULT 0,
  outbound_enabled TINYINT(1) NOT NULL DEFAULT 0,
  internal_only TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('active','inactive','blocked','pending') NOT NULL DEFAULT 'pending',
  freepbx_extension_id VARCHAR(50) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pbx_extensions_person
    FOREIGN KEY (person_id) REFERENCES people(id)
    ON DELETE SET NULL
);

CREATE TABLE pbx_extension_devices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  extension_id BIGINT UNSIGNED NOT NULL,
  device_type ENUM('browser','ip_phone','tablet','doorphone','softphone_mobile') NOT NULL,
  device_label VARCHAR(120) NOT NULL,
  sip_contact_mode ENUM('register','static','trunk_like') NOT NULL DEFAULT 'register',
  user_agent VARCHAR(255) NULL,
  websocket_uri VARCHAR(255) NULL,
  transport ENUM('wss','udp','tcp','tls') NOT NULL DEFAULT 'wss',
  registration_status ENUM('online','offline','unreachable','unknown') NOT NULL DEFAULT 'unknown',
  registered_at DATETIME NULL,
  last_seen_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pbx_extension_devices_extension
    FOREIGN KEY (extension_id) REFERENCES pbx_extensions(id)
    ON DELETE CASCADE
);

CREATE TABLE pbx_extension_presence (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  extension_id BIGINT UNSIGNED NOT NULL,
  device_id BIGINT UNSIGNED NULL,
  registration_state ENUM('online','offline','unreachable','unknown') NOT NULL DEFAULT 'unknown',
  call_state ENUM('idle','ringing','in_call','on_hold','busy') NOT NULL DEFAULT 'idle',
  do_not_disturb TINYINT(1) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_presence_extension
    FOREIGN KEY (extension_id) REFERENCES pbx_extensions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_presence_device
    FOREIGN KEY (device_id) REFERENCES pbx_extension_devices(id)
    ON DELETE SET NULL
);

CREATE TABLE internal_contacts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  person_id BIGINT UNSIGNED NULL,
  extension_id BIGINT UNSIGNED NULL,
  label VARCHAR(150) NOT NULL,
  department VARCHAR(100) NULL,
  contact_type ENUM('resident','employee','security','admin','doorphone','service') NOT NULL,
  speed_dial_code VARCHAR(20) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  visible_to_role VARCHAR(100) NULL,
  is_favorite_default TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_internal_contacts_person
    FOREIGN KEY (person_id) REFERENCES people(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_internal_contacts_extension
    FOREIGN KEY (extension_id) REFERENCES pbx_extensions(id)
    ON DELETE SET NULL
);

CREATE TABLE user_contact_preferences (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  contact_id BIGINT UNSIGNED NOT NULL,
  is_favorite TINYINT(1) NOT NULL DEFAULT 0,
  is_hidden TINYINT(1) NOT NULL DEFAULT 0,
  custom_label VARCHAR(150) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_contact_pref (user_id, contact_id),
  CONSTRAINT fk_ucp_user
    FOREIGN KEY (user_id) REFERENCES system_users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_ucp_contact
    FOREIGN KEY (contact_id) REFERENCES internal_contacts(id)
    ON DELETE CASCADE
);

CREATE TABLE call_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  ari_channel_id VARCHAR(120) NULL,
  ari_bridge_id VARCHAR(120) NULL,
  linkedid VARCHAR(120) NULL,
  direction ENUM('inbound','outbound','internal','doorphone') NOT NULL,
  source_extension_id BIGINT UNSIGNED NULL,
  target_extension_id BIGINT UNSIGNED NULL,
  source_number VARCHAR(30) NULL,
  target_number VARCHAR(30) NULL,
  started_at DATETIME NOT NULL,
  answered_at DATETIME NULL,
  ended_at DATETIME NULL,
  hangup_cause VARCHAR(80) NULL,
  final_status ENUM('initiated','ringing','answered','missed','failed','busy','cancelled','ended') NOT NULL DEFAULT 'initiated',
  initiated_by_user_id BIGINT UNSIGNED NULL,
  recording_enabled TINYINT(1) NOT NULL DEFAULT 0,
  recording_file VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_call_source_extension
    FOREIGN KEY (source_extension_id) REFERENCES pbx_extensions(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_call_target_extension
    FOREIGN KEY (target_extension_id) REFERENCES pbx_extensions(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_call_initiated_by
    FOREIGN KEY (initiated_by_user_id) REFERENCES system_users(id)
    ON DELETE SET NULL
);

CREATE TABLE call_participants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  call_session_id BIGINT UNSIGNED NOT NULL,
  extension_id BIGINT UNSIGNED NULL,
  person_id BIGINT UNSIGNED NULL,
  role_in_call ENUM('caller','callee','transferee','observer','door_unit') NOT NULL,
  joined_at DATETIME NOT NULL,
  left_at DATETIME NULL,
  channel_id VARCHAR(120) NULL,
  channel_name VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_participants_call
    FOREIGN KEY (call_session_id) REFERENCES call_sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_participants_extension
    FOREIGN KEY (extension_id) REFERENCES pbx_extensions(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_participants_person
    FOREIGN KEY (person_id) REFERENCES people(id)
    ON DELETE SET NULL
);

CREATE TABLE call_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  call_session_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('created','ringing','answered','hold','unhold','mute','unmute','dtmf','transfer_start','transfer_complete','hangup','recording_start','recording_stop') NOT NULL,
  event_source ENUM('app','ari','asterisk','user') NOT NULL,
  payload_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_call_events_call
    FOREIGN KEY (call_session_id) REFERENCES call_sessions(id)
    ON DELETE CASCADE
);

CREATE TABLE call_transfers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  call_session_id BIGINT UNSIGNED NOT NULL,
  transfer_type ENUM('blind','attended') NOT NULL,
  from_extension_id BIGINT UNSIGNED NOT NULL,
  to_extension_id BIGINT UNSIGNED NOT NULL,
  started_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  status ENUM('initiated','completed','failed','cancelled') NOT NULL DEFAULT 'initiated',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_call_transfer_call
    FOREIGN KEY (call_session_id) REFERENCES call_sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_call_transfer_from_ext
    FOREIGN KEY (from_extension_id) REFERENCES pbx_extensions(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_call_transfer_to_ext
    FOREIGN KEY (to_extension_id) REFERENCES pbx_extensions(id)
    ON DELETE RESTRICT
);

CREATE TABLE call_dtmf_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  call_session_id BIGINT UNSIGNED NOT NULL,
  participant_id BIGINT UNSIGNED NULL,
  digit VARCHAR(4) NOT NULL,
  direction ENUM('sent','received') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dtmf_call
    FOREIGN KEY (call_session_id) REFERENCES call_sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_dtmf_participant
    FOREIGN KEY (participant_id) REFERENCES call_participants(id)
    ON DELETE SET NULL
);

CREATE TABLE call_hold_states (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  call_session_id BIGINT UNSIGNED NOT NULL,
  participant_id BIGINT UNSIGNED NULL,
  hold_started_at DATETIME NOT NULL,
  hold_ended_at DATETIME NULL,
  hold_music_class VARCHAR(60) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hold_call
    FOREIGN KEY (call_session_id) REFERENCES call_sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_hold_participant
    FOREIGN KEY (participant_id) REFERENCES call_participants(id)
    ON DELETE SET NULL
);

CREATE TABLE doorphone_units (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL,
  building VARCHAR(120) NULL,
  location_description VARCHAR(255) NULL,
  extension_id BIGINT UNSIGNED NOT NULL,
  camera_url VARCHAR(255) NULL,
  unlock_relay_type ENUM('http','mqtt','gpio','none') NOT NULL DEFAULT 'none',
  unlock_relay_target VARCHAR(255) NULL,
  allowed_target_type ENUM('extension','ring_group','queue') NOT NULL DEFAULT 'extension',
  allowed_target_id VARCHAR(60) NULL,
  auto_answer_enabled TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('active','inactive','maintenance') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doorphone_extension
    FOREIGN KEY (extension_id) REFERENCES pbx_extensions(id)
    ON DELETE RESTRICT
);

CREATE TABLE doorphone_access_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doorphone_unit_id BIGINT UNSIGNED NOT NULL,
  call_session_id BIGINT UNSIGNED NULL,
  event_type ENUM('button_press','call_started','call_answered','unlock_sent','unlock_confirmed','unlock_failed','call_ended') NOT NULL,
  triggered_by_user_id BIGINT UNSIGNED NULL,
  payload_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doorphone_log_unit
    FOREIGN KEY (doorphone_unit_id) REFERENCES doorphone_units(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_doorphone_log_call
    FOREIGN KEY (call_session_id) REFERENCES call_sessions(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_doorphone_log_user
    FOREIGN KEY (triggered_by_user_id) REFERENCES system_users(id)
    ON DELETE SET NULL
);

CREATE TABLE pbx_sync_jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sync_type ENUM('extension_push','extension_pull','presence_pull','cdr_pull','doorphone_push') NOT NULL,
  reference_table VARCHAR(60) NULL,
  reference_id BIGINT UNSIGNED NULL,
  status ENUM('pending','running','success','failed') NOT NULL DEFAULT 'pending',
  request_payload JSON NULL,
  response_payload JSON NULL,
  error_message TEXT NULL,
  started_at DATETIME NULL,
  finished_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ari_event_queue (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_name VARCHAR(120) NOT NULL,
  channel_id VARCHAR(120) NULL,
  bridge_id VARCHAR(120) NULL,
  raw_payload JSON NOT NULL,
  processed TINYINT(1) NOT NULL DEFAULT 0,
  processed_at DATETIME NULL,
  process_error TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 2.2 Índices recomendados

```sql
CREATE INDEX idx_pbx_extensions_person_id ON pbx_extensions(person_id);
CREATE INDEX idx_pbx_extensions_status ON pbx_extensions(status);
CREATE INDEX idx_pbx_devices_extension_id ON pbx_extension_devices(extension_id);
CREATE INDEX idx_presence_extension_id ON pbx_extension_presence(extension_id);
CREATE INDEX idx_call_sessions_started_at ON call_sessions(started_at);
CREATE INDEX idx_call_sessions_source_ext ON call_sessions(source_extension_id);
CREATE INDEX idx_call_sessions_target_ext ON call_sessions(target_extension_id);
CREATE INDEX idx_call_sessions_linkedid ON call_sessions(linkedid);
CREATE INDEX idx_call_events_call_id ON call_events(call_session_id);
CREATE INDEX idx_ari_queue_processed ON ari_event_queue(processed, created_at);
CREATE INDEX idx_sync_jobs_status ON pbx_sync_jobs(status, created_at);
```

---

# 3) APIs reais

Aqui vou estruturar APIs REST do próprio módulo em **Next.js App Router**.

## 3.1 Módulos de API

### Extensões

* `GET /api/softphone/extensions`
* `POST /api/softphone/extensions`
* `GET /api/softphone/extensions/:id`
* `PATCH /api/softphone/extensions/:id`
* `POST /api/softphone/extensions/:id/provision`
* `POST /api/softphone/extensions/:id/block`
* `POST /api/softphone/extensions/:id/unblock`

### Contatos e diretório

* `GET /api/softphone/contacts`
* `GET /api/softphone/directory`
* `POST /api/softphone/contacts/favorites/:contactId`

### Chamada

* `POST /api/softphone/calls/dial`
* `POST /api/softphone/calls/:id/answer`
* `POST /api/softphone/calls/:id/hangup`
* `POST /api/softphone/calls/:id/mute`
* `POST /api/softphone/calls/:id/unmute`
* `POST /api/softphone/calls/:id/hold`
* `POST /api/softphone/calls/:id/unhold`
* `POST /api/softphone/calls/:id/dtmf`
* `POST /api/softphone/calls/:id/transfer`

### Presença

* `GET /api/softphone/presence`
* `GET /api/softphone/presence/:extension`

### Porteiro

* `GET /api/softphone/doorphones`
* `POST /api/softphone/doorphones/:id/call`
* `POST /api/softphone/doorphones/:id/unlock`

### Eventos em tempo real

* `GET /api/softphone/events/ws-token`
* `GET /api/softphone/calls/active`

---

## 3.2 Contratos principais

## A. Criar ramal

`POST /api/softphone/extensions`

```json
{
  "personId": 12,
  "extensionNumber": "2201",
  "displayName": "Apto 201 - Sergio",
  "extensionType": "webrtc",
  "callerIdName": "Sergio Castro",
  "callerIdNumber": "2201",
  "sipUsername": "2201",
  "webrtcEnabled": true,
  "voicemailEnabled": false,
  "outboundEnabled": false,
  "internalOnly": true
}
```

Resposta:

```json
{
  "id": 88,
  "extensionNumber": "2201",
  "status": "pending",
  "provisionStatus": "not_sent"
}
```

---

## B. Provisionar no PBX

`POST /api/softphone/extensions/:id/provision`

Fluxo:

1. lê ramal local
2. gera credenciais SIP
3. envia para FreePBX
4. atualiza `freepbx_extension_id`
5. grava `pbx_sync_jobs`

Resposta:

```json
{
  "success": true,
  "extensionId": 88,
  "freepbxExtensionId": "2201",
  "provisionedAt": "2026-03-12T21:10:00-03:00"
}
```

---

## C. Discagem

`POST /api/softphone/calls/dial`

```json
{
  "fromExtension": "2201",
  "toExtension": "2100",
  "originUserId": 5
}
```

Resposta:

```json
{
  "success": true,
  "callSessionId": 455,
  "uuid": "9c0adf43-6d3f-4bc0-a30b-f5f0e8d93c44",
  "status": "initiated"
}
```

---

## D. Hold

`POST /api/softphone/calls/:id/hold`

```json
{
  "participantExtension": "2201"
}
```

---

## E. DTMF

`POST /api/softphone/calls/:id/dtmf`

```json
{
  "digits": "9"
}
```

---

## F. Transferência

`POST /api/softphone/calls/:id/transfer`

```json
{
  "type": "blind",
  "toExtension": "2105"
}
```

---

## 3.3 Estrutura prática no Next.js

```text
app/
  api/
    softphone/
      extensions/
        route.ts
        [id]/route.ts
        [id]/provision/route.ts
      contacts/route.ts
      calls/
        dial/route.ts
        active/route.ts
        [id]/answer/route.ts
        [id]/hangup/route.ts
        [id]/mute/route.ts
        [id]/unmute/route.ts
        [id]/hold/route.ts
        [id]/unhold/route.ts
        [id]/dtmf/route.ts
        [id]/transfer/route.ts
      presence/route.ts
      presence/[extension]/route.ts
      doorphones/route.ts
      doorphones/[id]/call/route.ts
      doorphones/[id]/unlock/route.ts
```

---

## 3.4 Exemplo real de route handler: discagem

```ts
// app/api/softphone/calls/dial/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ariClient } from "@/lib/softphone/ari-client";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fromExtension, toExtension, originUserId } = body;

    if (!fromExtension || !toExtension) {
      return NextResponse.json(
        { error: "fromExtension e toExtension são obrigatórios" },
        { status: 400 }
      );
    }

    const [source] = await db.query(
      `SELECT * FROM pbx_extensions WHERE extension_number = ? AND status = 'active'`,
      [fromExtension]
    );

    const [target] = await db.query(
      `SELECT * FROM pbx_extensions WHERE extension_number = ? AND status = 'active'`,
      [toExtension]
    );

    if (!source || !target) {
      return NextResponse.json(
        { error: "Ramal de origem ou destino inválido" },
        { status: 404 }
      );
    }

    const uuid = randomUUID();

    const result = await db.query(
      `INSERT INTO call_sessions
       (uuid, direction, source_extension_id, target_extension_id, source_number, target_number, started_at, final_status, initiated_by_user_id)
       VALUES (?, 'internal', ?, ?, ?, ?, NOW(), 'initiated', ?)`,
      [uuid, source.id, target.id, source.extension_number, target.extension_number, originUserId ?? null]
    );

    const callSessionId = result.insertId;

    await db.query(
      `INSERT INTO call_events (call_session_id, event_type, event_source, payload_json)
       VALUES (?, 'created', 'app', JSON_OBJECT('fromExtension', ?, 'toExtension', ?))`,
      [callSessionId, fromExtension, toExtension]
    );

    // Disparo real via ARI / originate
    const originate = await ariClient.originateInternalCall({
      fromExtension,
      toExtension,
      appArgs: `callSessionId=${callSessionId}`
    });

    await db.query(
      `UPDATE call_sessions
       SET ari_channel_id = ?
       WHERE id = ?`,
      [originate.channelId ?? null, callSessionId]
    );

    return NextResponse.json({
      success: true,
      callSessionId,
      uuid,
      status: "initiated",
      ari: originate
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao iniciar chamada" },
      { status: 500 }
    );
  }
}
```

---

## 3.5 Exemplo real de service ARI

```ts
// lib/softphone/ari-client.ts
type OriginateInternalCallInput = {
  fromExtension: string;
  toExtension: string;
  appArgs?: string;
};

const ARI_BASE_URL = process.env.ARI_BASE_URL!;
const ARI_USERNAME = process.env.ARI_USERNAME!;
const ARI_PASSWORD = process.env.ARI_PASSWORD!;
const ARI_APP_NAME = process.env.ARI_APP_NAME!;

function authHeader() {
  const token = Buffer.from(`${ARI_USERNAME}:${ARI_PASSWORD}`).toString("base64");
  return `Basic ${token}`;
}

export const ariClient = {
  async originateInternalCall(input: OriginateInternalCallInput) {
    const endpoint = `PJSIP/${input.fromExtension}`;
    const variables = {
      TARGET_EXTENSION: input.toExtension
    };

    const res = await fetch(`${ARI_BASE_URL}/channels`, {
      method: "POST",
      headers: {
        "Authorization": authHeader(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        endpoint,
        app: ARI_APP_NAME,
        appArgs: input.appArgs || "",
        callerId: input.fromExtension,
        variables
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ARI originate falhou: ${text}`);
    }

    const data = await res.json();

    return {
      channelId: data.id,
      raw: data
    };
  },

  async hangupChannel(channelId: string) {
    const res = await fetch(`${ARI_BASE_URL}/channels/${channelId}`, {
      method: "DELETE",
      headers: {
        "Authorization": authHeader()
      }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Hangup falhou: ${text}`);
    }

    return true;
  },

  async sendDtmf(channelId: string, digit: string) {
    const params = new URLSearchParams({ dtmf: digit });
    const res = await fetch(`${ARI_BASE_URL}/channels/${channelId}/dtmf?${params}`, {
      method: "POST",
      headers: {
        "Authorization": authHeader()
      }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`DTMF falhou: ${text}`);
    }

    return true;
  }
};
```

---

# 4) Integração com ARI e PBX

Aqui está a parte mais importante.

## 4.1 O papel de cada componente

### FreePBX

Responsável por:

* criar e manter extensões
* dialplan principal
* troncos, rotas, ring groups, queues
* certificados e configuração SIP/WebRTC
* administração da PBX

### Asterisk ARI

Responsável por:

* receber eventos em tempo real
* controlar chamada após entrar no `Stasis`
* bridge
* hold/unhold
* mute/unmute
* DTMF
* transferências controladas pelo app
* telemetria de chamadas

### Next.js Softphone Backend

Responsável por:

* autenticação do usuário web
* autorização de quem pode ligar para quem
* vincular usuário ↔ ramal ↔ apartamento ↔ porteiro
* manter diretório interno
* gravar logs e estados
* integrar com ARI e com API/provisionamento do PBX

---

## 4.2 Estratégia de integração correta

## Estratégia recomendada

**FreePBX provisiona**
+
**Asterisk ARI controla chamadas**
+
**Next.js orquestra tudo**

### Não recomendo:

* editar direto tabelas internas do FreePBX como estratégia principal
* colocar toda a lógica do softphone apenas no frontend
* depender só de CDR para estado da chamada

---

## 4.3 Provisionamento de ramais

No PJSIP, a relação entre objetos como **endpoint**, **auth** e **aor** é central para o funcionamento do registro SIP, e o ambiente ARI assume que o canal é entregue ao app via **Stasis**. ([Asterisk Docs][2])

### Fluxo sugerido

1. usuário/admin cria ramal no módulo
2. módulo salva em `pbx_extensions`
3. módulo chama camada de provisionamento
4. camada de provisionamento cria/atualiza extensão no FreePBX
5. FreePBX aplica config
6. frontend recebe credenciais SIP/WebRTC
7. JsSIP ou SIP.js registra o usuário via WSS

### Para FreePBX

Hoje eu sugiro duas opções:

#### Opção A — ideal

Usar **APIs GraphQL de provisionamento do FreePBX**, quando disponíveis no ambiente. Há material oficial e tutoriais mostrando consulta/criação de extensões por GraphQL. ([FreePBX - Let Freedom Ring][3])

#### Opção B — fallback controlado

Criar um **serviço PBX local** no mesmo host da central, que:

* recebe requisições autenticadas do app
* executa provisionamento interno
* força reload/apply config
* devolve status ao Next.js

---

## 4.4 Fluxo de chamada com ARI

### Exemplo: chamada interna 2201 → 2100

1. frontend chama `POST /api/softphone/calls/dial`
2. backend valida permissão
3. backend cria `call_sessions`
4. backend dispara `originate` no ARI
5. canal entra em `Stasis`
6. ARI emite eventos via WebSocket
7. backend atualiza:

   * `call_sessions`
   * `call_events`
   * `pbx_extension_presence`
8. frontend recebe atualização em tempo real

Como a documentação do Asterisk explica, o ARI opera com:

* REST para comandos
* WebSocket para eventos
* Stasis para entregar o canal ao aplicativo externo. ([Asterisk Docs][1])

---

## 4.5 Eventos ARI que você deve tratar

No seu worker ARI, trate pelo menos:

* `StasisStart`
* `StasisEnd`
* `ChannelStateChange`
* `ChannelDtmfReceived`
* `ChannelEnteredBridge`
* `ChannelLeftBridge`
* `ChannelHangupRequest`
* `BridgeCreated`
* `BridgeDestroyed`

Fluxo do worker:

1. conecta no WebSocket ARI
2. persiste evento bruto em `ari_event_queue`
3. interpreta evento
4. localiza `call_session`
5. atualiza estado do banco
6. publica para frontend via WebSocket interno/SSE

---

## 4.6 Integração com porteiro eletrônico

### Modelo recomendado

Cada porteiro vira um `pbx_extensions.extension_type = 'doorphone'`.

Além disso:

* cadastra em `doorphone_units`
* define destino autorizado:

  * portaria
  * apartamento específico
  * ring group
* loga tudo em `doorphone_access_logs`

### Fluxo

1. botão pressionado
2. porteiro chama ramal/grupo
3. ARI cria `call_session.direction = 'doorphone'`
4. morador/portaria atende no softphone web
5. usuário pode acionar `POST /doorphones/:id/unlock`
6. backend dispara relé HTTP/MQTT/GPIO
7. log de abertura fica salvo

---

## 4.7 Integração com cadastro interno

Essa parte precisa ser nativa desde já.

### Exemplo de vínculos

* `people.type = resident`
* um morador pode ter 1 ou mais ramais
* portaria pode ter ramal físico + softphone web
* unidade habitacional pode ser ligada futuramente a:

  * apartamento
  * bloco
  * contrato
  * status de pagamento
  * permissões de internet
  * permissões de telefonia

Assim o módulo softphone já nasce preparado para cruzar com o restante do sistema.

---

# Arquitetura final recomendada

```text
[ Next.js Frontend ]
   -> SIP.js / JsSIP via WSS para registrar no PBX
   -> chamadas REST para backend do módulo

[ Next.js Backend / Softphone Module ]
   -> MySQL/MariaDB do módulo
   -> worker ARI websocket
   -> APIs REST
   -> auth / ACL / diretório / logs / presença
   -> serviço de provisionamento PBX

[ FreePBX / Asterisk ]
   -> PJSIP / WebRTC
   -> ramais e dialplan
   -> ARI
   -> bridges / channels / stasis
   -> integrações de porteiro
```

---

# Decisões que eu considero fechadas para a próxima fase

Eu fecharia assim:

### Banco

* banco próprio do módulo softphone

### Fonte da verdade

* **cadastro e regras** no app
* **telefonia/config SIP** no PBX
* **chamadas em tempo real** via ARI

### Provisionamento

* preferencialmente via **FreePBX GraphQL/provisioning**
* fallback com serviço local de provisionamento

### Controle de chamada

* via **ARI + Stasis**

### Frontend WebRTC

* SIP.js ou JsSIP registrando em **PJSIP/WSS**

---

# Próximo passo ideal

A próxima resposta já pode ser a continuação prática, com:

* **estrutura de pastas do backend**
* **models/repositories/services**
* **worker ARI completo**
* **rotas reais de provisionamento**
* **exemplo de dialplan/Stasis no Asterisk**
* **modelo de integração com SIP.js no frontend**

Se você quiser, no próximo passo eu já escrevo a **fase 2 inteira em formato de implementação**, com código-base do módulo.

[1]: https://docs.asterisk.org/Configuration/Interfaces/Asterisk-REST-Interface-ARI/?utm_source=chatgpt.com "Overview - Asterisk Documentation"
[2]: https://docs.asterisk.org/Configuration/Channel-Drivers/SIP/Configuring-res_pjsip/PJSIP-Configuration-Sections-and-Relationships/?utm_source=chatgpt.com "PJSIP Configuration Sections and Relationships"
[3]: https://www.freepbx.org/freepbx-graphql-provisioning-tutorial/?utm_source=chatgpt.com "FreePBX GraphQL Provisioning Tutorial"

Perfeito. Vamos entrar na **fase de implementação** e deixar isso em formato de backend real.

A base técnica continua correta: para WebRTC no Asterisk você precisa de **HTTPS/TLS**, **WebSocket para PJSIP**, e objetos **endpoint/auth/aor** para cada cliente; no lado de controle de chamadas, o **ARI** usa **REST para comandos**, **WebSocket para eventos**, e a aplicação recebe o canal via **Stasis**. O endpoint `POST /channels` do ARI cria uma chamada e, quando você informa `app`, o canal já fica inscrito na aplicação ARI para eventos subsequentes. Já no FreePBX, existe um caminho oficial documentado para provisionamento automatizado de extensões via **GraphQL**. No frontend, o SIP.js foi feito exatamente para esse fluxo: criar um User Agent, registrar no servidor SIP via WebSocket e receber `INVITE` para chamadas entrantes. ([Asterisk Docs][1])

# 1. Estrutura real do backend

Eu sugiro esta estrutura dentro do seu projeto Next.js:

```text
src/
  lib/
    db/
      index.ts
    softphone/
      ari/
        client.ts
        ws-listener.ts
        event-handler.ts
        event-publisher.ts
      pbx/
        freepbx-client.ts
        provision-service.ts
      calls/
        call-service.ts
        call-repository.ts
        presence-service.ts
      extensions/
        extension-service.ts
        extension-repository.ts
      contacts/
        contact-service.ts
      doorphone/
        doorphone-service.ts
      auth/
        permissions.ts
      types/
        softphone.ts
      utils/
        sip-secret.ts
        normalize.ts

  app/
    api/
      softphone/
        extensions/
          route.ts
          [id]/
            route.ts
            provision/
              route.ts
        calls/
          dial/
            route.ts
          active/
            route.ts
          [id]/
            answer/
              route.ts
            hangup/
              route.ts
            mute/
              route.ts
            unmute/
              route.ts
            hold/
              route.ts
            unhold/
              route.ts
            dtmf/
              route.ts
            transfer/
              route.ts
        presence/
          route.ts
          [extension]/
            route.ts
        contacts/
          route.ts
        doorphones/
          route.ts
          [id]/
            call/
              route.ts
            unlock/
              route.ts
```

---

# 2. Tipos base

```ts
// src/lib/softphone/types/softphone.ts
export type ExtensionType =
  | "webrtc"
  | "sip_phone"
  | "doorphone"
  | "ivr"
  | "queue"
  | "service";

export type CallDirection =
  | "inbound"
  | "outbound"
  | "internal"
  | "doorphone";

export type CallFinalStatus =
  | "initiated"
  | "ringing"
  | "answered"
  | "missed"
  | "failed"
  | "busy"
  | "cancelled"
  | "ended";

export type TransferType = "blind" | "attended";

export interface DialInput {
  fromExtension: string;
  toExtension: string;
  originUserId?: number;
}

export interface CreateExtensionInput {
  personId?: number | null;
  extensionNumber: string;
  displayName: string;
  extensionType: ExtensionType;
  callerIdName: string;
  callerIdNumber: string;
  sipUsername: string;
  webrtcEnabled?: boolean;
  voicemailEnabled?: boolean;
  outboundEnabled?: boolean;
  internalOnly?: boolean;
}
```

---

# 3. Repositórios

## 3.1 Repositório de extensões

```ts
// src/lib/softphone/extensions/extension-repository.ts
import { db } from "@/lib/db";
import { CreateExtensionInput } from "../types/softphone";

export const extensionRepository = {
  async findById(id: number) {
    const [rows]: any = await db.query(
      `SELECT * FROM pbx_extensions WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows?.[0] ?? null;
  },

  async findByExtensionNumber(extensionNumber: string) {
    const [rows]: any = await db.query(
      `SELECT * FROM pbx_extensions WHERE extension_number = ? LIMIT 1`,
      [extensionNumber]
    );
    return rows?.[0] ?? null;
  },

  async list() {
    const [rows]: any = await db.query(
      `SELECT e.*, p.full_name
       FROM pbx_extensions e
       LEFT JOIN people p ON p.id = e.person_id
       ORDER BY e.extension_number ASC`
    );
    return rows;
  },

  async create(input: CreateExtensionInput) {
    const [result]: any = await db.query(
      `INSERT INTO pbx_extensions (
        person_id,
        extension_number,
        display_name,
        extension_type,
        callerid_name,
        callerid_number,
        sip_username,
        webrtc_enabled,
        voicemail_enabled,
        outbound_enabled,
        internal_only,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        input.personId ?? null,
        input.extensionNumber,
        input.displayName,
        input.extensionType,
        input.callerIdName,
        input.callerIdNumber,
        input.sipUsername,
        input.webrtcEnabled ? 1 : 0,
        input.voicemailEnabled ? 1 : 0,
        input.outboundEnabled ? 1 : 0,
        input.internalOnly !== false ? 1 : 0,
      ]
    );

    return this.findById(result.insertId);
  },

  async markProvisioned(id: number, freepbxExtensionId: string) {
    await db.query(
      `UPDATE pbx_extensions
       SET freepbx_extension_id = ?, status = 'active'
       WHERE id = ?`,
      [freepbxExtensionId, id]
    );
    return this.findById(id);
  },
};
```

---

# 4. Serviço de provisionamento PBX

Como o FreePBX tem fluxo documentado para provisionamento por GraphQL, eu montaria o módulo com um client dedicado. Isso deixa seu sistema livre para, no futuro, trocar GraphQL por um provisionador local sem mexer nas rotas de negócio. ([FreePBX - Let Freedom Ring][2])

## 4.1 Client do FreePBX

```ts
// src/lib/softphone/pbx/freepbx-client.ts
const FREEPBX_URL = process.env.FREEPBX_URL!;
const FREEPBX_GQL_URL = `${FREEPBX_URL}/admin/api/api/gql`;
const FREEPBX_TOKEN = process.env.FREEPBX_TOKEN!;

async function gqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(FREEPBX_GQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FREEPBX_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`FreePBX GraphQL error HTTP ${res.status}`);
  }

  const json = await res.json();

  if (json.errors?.length) {
    throw new Error(JSON.stringify(json.errors));
  }

  return json.data;
}

export const freepbxClient = {
  async createExtension(params: {
    extension: string;
    name: string;
    secret: string;
    outboundCid?: string;
  }) {
    // O shape real exato depende da versão/módulos do FreePBX.
    // Aqui deixamos encapsulado para ajuste fino no seu ambiente.
    const mutation = `
      mutation CreateExtension($input: GenericExtensionInput!) {
        createExtension(input: $input) {
          status
          message
          extension {
            extensionId
            user
            name
          }
        }
      }
    `;

    return gqlRequest(mutation, {
      input: {
        extensionId: params.extension,
        user: params.extension,
        name: params.name,
        secret: params.secret,
        outboundCid: params.outboundCid ?? params.extension,
      },
    });
  },

  async applyConfig() {
    const mutation = `
      mutation {
        doReload {
          status
          message
        }
      }
    `;
    return gqlRequest(mutation);
  },
};
```

## 4.2 Serviço de provisionamento

```ts
// src/lib/softphone/pbx/provision-service.ts
import crypto from "crypto";
import { db } from "@/lib/db";
import { extensionRepository } from "../extensions/extension-repository";
import { freepbxClient } from "./freepbx-client";

function generateSipSecret() {
  return crypto.randomBytes(12).toString("base64url");
}

export const provisionService = {
  async provisionExtension(extensionId: number) {
    const extension = await extensionRepository.findById(extensionId);
    if (!extension) throw new Error("Ramal não encontrado");

    const sipSecret = generateSipSecret();

    await db.query(
      `UPDATE pbx_extensions
       SET secret_ref = ?
       WHERE id = ?`,
      [sipSecret, extensionId]
    );

    const provisionResult = await freepbxClient.createExtension({
      extension: extension.extension_number,
      name: extension.display_name,
      secret: sipSecret,
      outboundCid: extension.callerid_number,
    });

    await freepbxClient.applyConfig();

    await db.query(
      `INSERT INTO pbx_sync_jobs
       (sync_type, reference_table, reference_id, status, request_payload, response_payload, started_at, finished_at)
       VALUES ('extension_push', 'pbx_extensions', ?, 'success', ?, ?, NOW(), NOW())`,
      [
        extensionId,
        JSON.stringify({ extensionId }),
        JSON.stringify(provisionResult),
      ]
    );

    return extensionRepository.markProvisioned(
      extensionId,
      extension.extension_number
    );
  },
};
```

---

# 5. Serviço de chamadas

O ARI foi desenhado para isso: criar canais, acompanhar o estado deles e controlá-los após entrada em `Stasis`. Na prática, sua aplicação deve usar REST para comandar e WebSocket para acompanhar. ([Asterisk Docs][3])

## 5.1 Cliente ARI

```ts
// src/lib/softphone/ari/client.ts
const ARI_BASE_URL = process.env.ARI_BASE_URL!;
const ARI_USERNAME = process.env.ARI_USERNAME!;
const ARI_PASSWORD = process.env.ARI_PASSWORD!;
const ARI_APP_NAME = process.env.ARI_APP_NAME!;

function authHeader() {
  return (
    "Basic " +
    Buffer.from(`${ARI_USERNAME}:${ARI_PASSWORD}`).toString("base64")
  );
}

async function ariFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${ARI_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ARI ${path} failed: ${res.status} ${text}`);
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json();
  }
  return null;
}

export const ariClient = {
  async originateToStasis(params: {
    endpoint: string;
    callerId: string;
    appArgs?: string;
    variables?: Record<string, string>;
  }) {
    return ariFetch(`/channels`, {
      method: "POST",
      body: JSON.stringify({
        endpoint: params.endpoint,
        app: ARI_APP_NAME,
        appArgs: params.appArgs ?? "",
        callerId: params.callerId,
        variables: params.variables ?? {},
      }),
    });
  },

  async answer(channelId: string) {
    return ariFetch(`/channels/${channelId}/answer`, { method: "POST" });
  },

  async hangup(channelId: string) {
    return ariFetch(`/channels/${channelId}`, { method: "DELETE" });
  },

  async sendDtmf(channelId: string, digit: string) {
    return ariFetch(`/channels/${channelId}/dtmf?dtmf=${encodeURIComponent(digit)}`, {
      method: "POST",
    });
  },

  async hold(channelId: string) {
    return ariFetch(`/channels/${channelId}/hold`, { method: "POST" });
  },

  async unhold(channelId: string) {
    return ariFetch(`/channels/${channelId}/unhold`, { method: "DELETE" });
  },

  async mute(channelId: string, direction: "in" | "out" | "both" = "both") {
    return ariFetch(`/channels/${channelId}/mute?direction=${direction}`, {
      method: "POST",
    });
  },

  async unmute(channelId: string, direction: "in" | "out" | "both" = "both") {
    return ariFetch(`/channels/${channelId}/mute?direction=${direction}`, {
      method: "DELETE",
    });
  },

  async blindTransfer(channelId: string, endpoint: string) {
    return ariFetch(`/channels/${channelId}/redirect?endpoint=${encodeURIComponent(endpoint)}`, {
      method: "POST",
    });
  },
};
```

## 5.2 Serviço de chamada

```ts
// src/lib/softphone/calls/call-service.ts
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { ariClient } from "../ari/client";
import { extensionRepository } from "../extensions/extension-repository";
import { DialInput } from "../types/softphone";

export const callService = {
  async dial(input: DialInput) {
    const source = await extensionRepository.findByExtensionNumber(input.fromExtension);
    const target = await extensionRepository.findByExtensionNumber(input.toExtension);

    if (!source || !target) {
      throw new Error("Ramal de origem ou destino não encontrado");
    }

    if (source.status !== "active" || target.status !== "active") {
      throw new Error("Ramal inativo");
    }

    const uuid = randomUUID();

    const [result]: any = await db.query(
      `INSERT INTO call_sessions
       (uuid, direction, source_extension_id, target_extension_id, source_number, target_number, started_at, final_status, initiated_by_user_id)
       VALUES (?, 'internal', ?, ?, ?, ?, NOW(), 'initiated', ?)`,
      [
        uuid,
        source.id,
        target.id,
        source.extension_number,
        target.extension_number,
        input.originUserId ?? null,
      ]
    );

    const callSessionId = result.insertId;

    await db.query(
      `INSERT INTO call_events
       (call_session_id, event_type, event_source, payload_json)
       VALUES (?, 'created', 'app', JSON_OBJECT('from', ?, 'to', ?))`,
      [callSessionId, input.fromExtension, input.toExtension]
    );

    const ariResult = await ariClient.originateToStasis({
      endpoint: `PJSIP/${source.extension_number}`,
      callerId: source.extension_number,
      appArgs: `callSessionId=${callSessionId}`,
      variables: {
        TARGET_EXTENSION: target.extension_number,
        CALL_SESSION_ID: String(callSessionId),
      },
    });

    await db.query(
      `UPDATE call_sessions SET ari_channel_id = ? WHERE id = ?`,
      [ariResult.id ?? null, callSessionId]
    );

    return {
      callSessionId,
      uuid,
      ariChannelId: ariResult.id ?? null,
      status: "initiated",
    };
  },
};
```

---

# 6. Worker ARI real

O mínimo que você deve processar no listener é `StasisStart`, `ChannelStateChange`, `StasisEnd` e DTMF; isso está alinhado com a própria documentação do ARI, que usa exatamente esses eventos como base para acompanhar o ciclo de vida do canal. ([Asterisk Docs][4])

## 6.1 Listener

```ts
// src/lib/softphone/ari/ws-listener.ts
import WebSocket from "ws";
import { handleAriEvent } from "./event-handler";

const ARI_WS_URL = process.env.ARI_WS_URL!;
const ARI_USERNAME = process.env.ARI_USERNAME!;
const ARI_PASSWORD = process.env.ARI_PASSWORD!;
const ARI_APP_NAME = process.env.ARI_APP_NAME!;

export function startAriListener() {
  const auth = Buffer.from(`${ARI_USERNAME}:${ARI_PASSWORD}`).toString("base64");
  const ws = new WebSocket(
    `${ARI_WS_URL}/events?app=${encodeURIComponent(ARI_APP_NAME)}`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  ws.on("open", () => {
    console.log("[ARI] websocket conectado");
  });

  ws.on("message", async (message) => {
    try {
      const payload = JSON.parse(message.toString());
      await handleAriEvent(payload);
    } catch (error) {
      console.error("[ARI] erro processando evento", error);
    }
  });

  ws.on("close", () => {
    console.warn("[ARI] websocket fechado, reconectar em 5s");
    setTimeout(startAriListener, 5000);
  });

  ws.on("error", (err) => {
    console.error("[ARI] erro websocket", err);
  });
}
```

## 6.2 Handler

```ts
// src/lib/softphone/ari/event-handler.ts
import { db } from "@/lib/db";

function getChannelId(event: any) {
  return event.channel?.id ?? null;
}

async function logRawEvent(event: any) {
  await db.query(
    `INSERT INTO ari_event_queue (event_name, channel_id, bridge_id, raw_payload)
     VALUES (?, ?, ?, ?)`,
    [
      event.type ?? "unknown",
      event.channel?.id ?? null,
      event.bridge?.id ?? null,
      JSON.stringify(event),
    ]
  );
}

export async function handleAriEvent(event: any) {
  await logRawEvent(event);

  const channelId = getChannelId(event);

  if (event.type === "StasisStart") {
    const callSessionId = Number(event.args?.[0]?.split("=")[1] || event.channel?.dialplan?.exten || 0);

    if (callSessionId) {
      await db.query(
        `UPDATE call_sessions
         SET final_status = 'ringing'
         WHERE id = ?`,
        [callSessionId]
      );

      await db.query(
        `INSERT INTO call_events (call_session_id, event_type, event_source, payload_json)
         VALUES (?, 'ringing', 'ari', ?)`,
        [callSessionId, JSON.stringify(event)]
      );
    }
    return;
  }

  if (event.type === "ChannelStateChange" && channelId) {
    const state = event.channel?.state;

    const [rows]: any = await db.query(
      `SELECT id FROM call_sessions WHERE ari_channel_id = ? LIMIT 1`,
      [channelId]
    );
    const call = rows?.[0];
    if (!call) return;

    if (state === "Up") {
      await db.query(
        `UPDATE call_sessions
         SET answered_at = NOW(), final_status = 'answered'
         WHERE id = ?`,
        [call.id]
      );

      await db.query(
        `INSERT INTO call_events (call_session_id, event_type, event_source, payload_json)
         VALUES (?, 'answered', 'ari', ?)`,
        [call.id, JSON.stringify(event)]
      );
    }
    return;
  }

  if (event.type === "ChannelDtmfReceived" && channelId) {
    const [rows]: any = await db.query(
      `SELECT id FROM call_sessions WHERE ari_channel_id = ? LIMIT 1`,
      [channelId]
    );
    const call = rows?.[0];
    if (!call) return;

    await db.query(
      `INSERT INTO call_dtmf_events (call_session_id, digit, direction)
       VALUES (?, ?, 'received')`,
      [call.id, event.digit]
    );

    await db.query(
      `INSERT INTO call_events (call_session_id, event_type, event_source, payload_json)
       VALUES (?, 'dtmf', 'ari', ?)`,
      [call.id, JSON.stringify(event)]
    );
    return;
  }

  if (event.type === "StasisEnd" && channelId) {
    const [rows]: any = await db.query(
      `SELECT id, answered_at FROM call_sessions WHERE ari_channel_id = ? LIMIT 1`,
      [channelId]
    );
    const call = rows?.[0];
    if (!call) return;

    const finalStatus = call.answered_at ? "ended" : "missed";

    await db.query(
      `UPDATE call_sessions
       SET ended_at = NOW(), final_status = ?
       WHERE id = ?`,
      [finalStatus, call.id]
    );

    await db.query(
      `INSERT INTO call_events (call_session_id, event_type, event_source, payload_json)
       VALUES (?, 'hangup', 'ari', ?)`,
      [call.id, JSON.stringify(event)]
    );
  }
}
```

---

# 7. APIs reais

## 7.1 Criar extensão

```ts
// src/app/api/softphone/extensions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { extensionRepository } from "@/lib/softphone/extensions/extension-repository";

export async function GET() {
  const data = await extensionRepository.list();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const created = await extensionRepository.create({
    personId: body.personId ?? null,
    extensionNumber: body.extensionNumber,
    displayName: body.displayName,
    extensionType: body.extensionType,
    callerIdName: body.callerIdName,
    callerIdNumber: body.callerIdNumber,
    sipUsername: body.sipUsername,
    webrtcEnabled: body.webrtcEnabled ?? true,
    voicemailEnabled: body.voicemailEnabled ?? false,
    outboundEnabled: body.outboundEnabled ?? false,
    internalOnly: body.internalOnly ?? true,
  });

  return NextResponse.json(created, { status: 201 });
}
```

## 7.2 Provisionar extensão

```ts
// src/app/api/softphone/extensions/[id]/provision/route.ts
import { NextRequest, NextResponse } from "next/server";
import { provisionService } from "@/lib/softphone/pbx/provision-service";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await provisionService.provisionExtension(Number(id));
    return NextResponse.json({ success: true, extension: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

## 7.3 Discagem

```ts
// src/app/api/softphone/calls/dial/route.ts
import { NextRequest, NextResponse } from "next/server";
import { callService } from "@/lib/softphone/calls/call-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await callService.dial({
      fromExtension: body.fromExtension,
      toExtension: body.toExtension,
      originUserId: body.originUserId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

## 7.4 Hold, mute, DTMF, hangup, transfer

```ts
// src/app/api/softphone/calls/[id]/dtmf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ariClient } from "@/lib/softphone/ari/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { digits } = await req.json();
  const { id } = await params;

  const [rows]: any = await db.query(
    `SELECT ari_channel_id FROM call_sessions WHERE id = ? LIMIT 1`,
    [id]
  );
  const call = rows?.[0];
  if (!call?.ari_channel_id) {
    return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
  }

  for (const digit of String(digits)) {
    await ariClient.sendDtmf(call.ari_channel_id, digit);
  }

  return NextResponse.json({ success: true });
}
```

O mesmo padrão vale para `hold`, `unhold`, `mute`, `unmute`, `hangup` e `transfer`.

---

# 8. Dialplan mínimo para entrar no ARI

Como o ARI trabalha com `Stasis`, você precisa de um contexto do dialplan que entregue a chamada à aplicação externa. Isso é parte oficial da configuração do ARI no Asterisk. ([Asterisk Docs][5])

Exemplo mínimo:

```ini
; extensions_custom.conf

[softphone-stasis]
exten => _X.,1,NoOp(Softphone Stasis entry ${EXTEN})
 same => n,Set(__TARGET_EXTENSION=${EXTEN})
 same => n,Stasis(softphone-app,callSessionId=${CALL_SESSION_ID})
 same => n,Hangup()
```

Agora, quando sua aplicação originar uma chamada, ela pode mandar o canal para `softphone-app`.

---

# 9. PJSIP / WebRTC mínimo

Para clientes WebRTC, a documentação do Asterisk deixa claro que você precisa de **HTTPS/TLS**, **PJSIP WebSocket transport**, e objetos do cliente em PJSIP. ([Asterisk Docs][1])

Exemplo conceitual:

```ini
; pjsip_custom.conf

[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0

[2201]
type=endpoint
context=from-internal
disallow=all
allow=opus,ulaw,alaw
webrtc=yes
auth=2201-auth
aors=2201
rtcp_mux=yes
ice_support=yes
media_encryption=dtls
use_avpf=yes
dtls_auto_generate_cert=yes

[2201-auth]
type=auth
auth_type=userpass
username=2201
password=SEGREDO_FORTE

[2201]
type=aor
max_contacts=5
remove_existing=yes
```

---

# 10. Integração frontend com SIP.js

O SIP.js mantém o WebSocket de sinalização, registra o agente SIP e recebe chamadas entrantes por delegate/invite. Isso casa perfeitamente com o seu módulo: o navegador fala SIP/WebRTC com o PBX, e o backend fala ARI/REST com o Asterisk para orquestração e estado. ([sipjs.com][6])

Exemplo base:

```ts
// src/lib/softphone/frontend/sip-client.ts
import {
  UserAgent,
  Registerer,
  Inviter,
  Invitation,
  SessionState,
} from "sip.js";

export async function createSipClient(params: {
  extension: string;
  password: string;
  domain: string;
  wsServer: string;
  audioEl: HTMLAudioElement;
  onInvite?: (invitation: Invitation) => void;
}) {
  const uri = UserAgent.makeURI(`sip:${params.extension}@${params.domain}`);
  if (!uri) throw new Error("URI SIP inválida");

  const userAgent = new UserAgent({
    uri,
    transportOptions: {
      server: params.wsServer,
    },
    authorizationUsername: params.extension,
    authorizationPassword: params.password,
    delegate: {
      onInvite: (invitation) => {
        params.onInvite?.(invitation);
      },
    },
  });

  await userAgent.start();

  const registerer = new Registerer(userAgent);
  await registerer.register();

  return {
    userAgent,
    registerer,

    async makeCall(targetExtension: string) {
      const target = UserAgent.makeURI(`sip:${targetExtension}@${params.domain}`);
      if (!target) throw new Error("Destino inválido");

      const inviter = new Inviter(userAgent, target, {
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
      });

      inviter.stateChange.addListener((state) => {
        if (state === SessionState.Established) {
          const sdh: any = inviter.sessionDescriptionHandler;
          const receivers = sdh.peerConnection.getReceivers();
          const remoteStream = new MediaStream();
          receivers.forEach((r: RTCRtpReceiver) => {
            if (r.track) remoteStream.addTrack(r.track);
          });
          params.audioEl.srcObject = remoteStream;
          params.audioEl.play().catch(() => {});
        }
      });

      await inviter.invite();
      return inviter;
    },
  };
}
```

---

# 11. Fluxo operacional fechado

## Criar e provisionar ramal

1. `POST /api/softphone/extensions`
2. `POST /api/softphone/extensions/:id/provision`
3. FreePBX cria extensão
4. FreePBX aplica config
5. frontend recebe `extension + password + wsServer`

## Registrar no navegador

1. frontend inicializa `UserAgent`
2. faz `register()`
3. backend atualiza `pbx_extension_devices` e presença

## Fazer chamada

1. frontend manda `POST /calls/dial`
2. backend cria `call_session`
3. backend chama ARI originate
4. worker ARI escuta eventos
5. frontend acompanha estado por SSE/WebSocket interno

## Receber chamada

1. PBX envia `INVITE` ao navegador
2. SIP.js dispara `onInvite`
3. usuário atende
4. backend reflete o estado via ARI

## Porteiro eletrônico

1. porteiro é um ramal SIP do tipo `doorphone`
2. chama um grupo ou apartamento
3. o módulo registra tudo em `doorphone_access_logs`
4. `POST /doorphones/:id/unlock` aciona relé HTTP/MQTT/GPIO

---

# 12. O que eu fecharia como próxima entrega

A próxima etapa ideal já é completamente prática:

* `DDL final v1`
* `seed inicial`
* `worker ARI executável`
* `rotas completas de hold, mute, transfer`
* `SSE/WebSocket interno do Next.js para refletir estado da chamada`
* `provisionador FreePBX ajustado ao schema GraphQL real da sua central`
* `componente React do discador`

Na próxima resposta eu posso seguir direto com o **pacote completo da fase 3**, já entregando:
**DDL consolidado + seeds + rotas completas + worker ARI + componente React do softphone**.

[1]: https://docs.asterisk.org/Configuration/WebRTC/Configuring-Asterisk-for-WebRTC-Clients/?utm_source=chatgpt.com "Configuring Asterisk for WebRTC Clients"
[2]: https://www.freepbx.org/freepbx-graphql-provisioning-tutorial/?utm_source=chatgpt.com "FreePBX GraphQL Provisioning Tutorial"
[3]: https://docs.asterisk.org/Latest_API/API_Documentation/Asterisk_REST_Interface/Channels_REST_API/?utm_source=chatgpt.com "Channels - Asterisk Documentation"
[4]: https://docs.asterisk.org/Configuration/Interfaces/Asterisk-REST-Interface-ARI/Introduction-to-ARI-and-Channels/ARI-and-Channels-Manipulating-Channel-State/?utm_source=chatgpt.com "Channel State"
[5]: https://docs.asterisk.org/Configuration/Interfaces/Asterisk-REST-Interface-ARI/Asterisk-Configuration-for-ARI/?utm_source=chatgpt.com "Asterisk Configuration for ARI"
[6]: https://sipjs.com/?utm_source=chatgpt.com "SIP.js: SIP Signaling JavaScript Library for WebRTC Developers"

Perfeito. Vou seguir já com a **entrega prática da fase 3**:

1. **DDL consolidado v1**
2. **seeds iniciais**
3. **rotas completas de operação**
4. **worker ARI executável**
5. **componente React do softphone**
6. **pontos de ligação com FreePBX / Asterisk**

A base técnica continua correta: para cliente WebRTC no Asterisk você precisa de **HTTPS/TLS**, **PJSIP WebSocket transport** e objetos **endpoint/auth/aor**; para controle de chamada, o **ARI** expõe canais, bridges e mídia via API assíncrona, e o `POST /channels` origina chamadas, podendo já inscrever o canal numa app **Stasis**. No frontend, o SIP.js usa `UserAgent`, registro e tratamento de `INVITE` para chamadas entrantes. O FreePBX também documenta um caminho de provisionamento automatizado por **GraphQL**. ([Asterisk Docs][1])

---

## 1) DDL consolidado v1

Use este schema como **base oficial do módulo Softphone**.

```sql
CREATE TABLE people (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type ENUM('resident','employee','security','admin','concierge','service') NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NULL,
  phone_mobile VARCHAR(30) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE system_users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  person_id BIGINT UNSIGNED NOT NULL,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('resident','employee','security','admin','concierge','operator') NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_system_users_person
    FOREIGN KEY (person_id) REFERENCES people(id)
    ON DELETE CASCADE
);

CREATE TABLE pbx_extensions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  person_id BIGINT UNSIGNED NULL,
  extension_number VARCHAR(20) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  extension_type ENUM('webrtc','sip_phone','doorphone','ivr','queue','service') NOT NULL,
  secret_ref VARCHAR(120) NULL,
  callerid_name VARCHAR(120) NOT NULL,
  callerid_number VARCHAR(30) NOT NULL,
  sip_username VARCHAR(80) NOT NULL UNIQUE,
  webrtc_enabled TINYINT(1) NOT NULL DEFAULT 1,
  voicemail_enabled TINYINT(1) NOT NULL DEFAULT 0,
  outbound_enabled TINYINT(1) NOT NULL DEFAULT 0,
  internal_only TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('active','inactive','blocked','pending') NOT NULL DEFAULT 'pending',
  freepbx_extension_id VARCHAR(50) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pbx_extensions_person
    FOREIGN KEY (person_id) REFERENCES people(id)
    ON DELETE SET NULL
);

CREATE TABLE pbx_extension_devices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  extension_id BIGINT UNSIGNED NOT NULL,
  device_type ENUM('browser','ip_phone','tablet','doorphone','softphone_mobile') NOT NULL,
  device_label VARCHAR(120) NOT NULL,
  sip_contact_mode ENUM('register','static','trunk_like') NOT NULL DEFAULT 'register',
  user_agent VARCHAR(255) NULL,
  websocket_uri VARCHAR(255) NULL,
  transport ENUM('wss','udp','tcp','tls') NOT NULL DEFAULT 'wss',
  registration_status ENUM('online','offline','unreachable','unknown') NOT NULL DEFAULT 'unknown',
  registered_at DATETIME NULL,
  last_seen_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pbx_extension_devices_extension
    FOREIGN KEY (extension_id) REFERENCES pbx_extensions(id)
    ON DELETE CASCADE
);

CREATE TABLE pbx_extension_presence (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  extension_id BIGINT UNSIGNED NOT NULL,
  device_id BIGINT UNSIGNED NULL,
  registration_state ENUM('online','offline','unreachable','unknown') NOT NULL DEFAULT 'unknown',
  call_state ENUM('idle','ringing','in_call','on_hold','busy') NOT NULL DEFAULT 'idle',
  do_not_disturb TINYINT(1) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_presence_extension
    FOREIGN KEY (extension_id) REFERENCES pbx_extensions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_presence_device
    FOREIGN KEY (device_id) REFERENCES pbx_extension_devices(id)
    ON DELETE SET NULL
);

CREATE TABLE internal_contacts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  person_id BIGINT UNSIGNED NULL,
  extension_id BIGINT UNSIGNED NULL,
  label VARCHAR(150) NOT NULL,
  department VARCHAR(100) NULL,
  contact_type ENUM('resident','employee','security','admin','doorphone','service') NOT NULL,
  speed_dial_code VARCHAR(20) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  visible_to_role VARCHAR(100) NULL,
  is_favorite_default TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_internal_contacts_person
    FOREIGN KEY (person_id) REFERENCES people(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_internal_contacts_extension
    FOREIGN KEY (extension_id) REFERENCES pbx_extensions(id)
    ON DELETE SET NULL
);

CREATE TABLE user_contact_preferences (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  contact_id BIGINT UNSIGNED NOT NULL,
  is_favorite TINYINT(1) NOT NULL DEFAULT 0,
  is_hidden TINYINT(1) NOT NULL DEFAULT 0,
  custom_label VARCHAR(150) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_contact_pref (user_id, contact_id),
  CONSTRAINT fk_ucp_user
    FOREIGN KEY (user_id) REFERENCES system_users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_ucp_contact
    FOREIGN KEY (contact_id) REFERENCES internal_contacts(id)
    ON DELETE CASCADE
);

CREATE TABLE call_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  ari_channel_id VARCHAR(120) NULL,
  ari_bridge_id VARCHAR(120) NULL,
  linkedid VARCHAR(120) NULL,
  direction ENUM('inbound','outbound','internal','doorphone') NOT NULL,
  source_extension_id BIGINT UNSIGNED NULL,
  target_extension_id BIGINT UNSIGNED NULL,
  source_number VARCHAR(30) NULL,
  target_number VARCHAR(30) NULL,
  started_at DATETIME NOT NULL,
  answered_at DATETIME NULL,
  ended_at DATETIME NULL,
  hangup_cause VARCHAR(80) NULL,
  final_status ENUM('initiated','ringing','answered','missed','failed','busy','cancelled','ended') NOT NULL DEFAULT 'initiated',
  initiated_by_user_id BIGINT UNSIGNED NULL,
  recording_enabled TINYINT(1) NOT NULL DEFAULT 0,
  recording_file VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_call_source_extension
    FOREIGN KEY (source_extension_id) REFERENCES pbx_extensions(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_call_target_extension
    FOREIGN KEY (target_extension_id) REFERENCES pbx_extensions(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_call_initiated_by
    FOREIGN KEY (initiated_by_user_id) REFERENCES system_users(id)
    ON DELETE SET NULL
);

CREATE TABLE call_participants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  call_session_id BIGINT UNSIGNED NOT NULL,
  extension_id BIGINT UNSIGNED NULL,
  person_id BIGINT UNSIGNED NULL,
  role_in_call ENUM('caller','callee','transferee','observer','door_unit') NOT NULL,
  joined_at DATETIME NOT NULL,
  left_at DATETIME NULL,
  channel_id VARCHAR(120) NULL,
  channel_name VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_participants_call
    FOREIGN KEY (call_session_id) REFERENCES call_sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_participants_extension
    FOREIGN KEY (extension_id) REFERENCES pbx_extensions(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_participants_person
    FOREIGN KEY (person_id) REFERENCES people(id)
    ON DELETE SET NULL
);

CREATE TABLE call_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  call_session_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('created','ringing','answered','hold','unhold','mute','unmute','dtmf','transfer_start','transfer_complete','hangup','recording_start','recording_stop') NOT NULL,
  event_source ENUM('app','ari','asterisk','user') NOT NULL,
  payload_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_call_events_call
    FOREIGN KEY (call_session_id) REFERENCES call_sessions(id)
    ON DELETE CASCADE
);

CREATE TABLE call_transfers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  call_session_id BIGINT UNSIGNED NOT NULL,
  transfer_type ENUM('blind','attended') NOT NULL,
  from_extension_id BIGINT UNSIGNED NOT NULL,
  to_extension_id BIGINT UNSIGNED NOT NULL,
  started_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  status ENUM('initiated','completed','failed','cancelled') NOT NULL DEFAULT 'initiated',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_call_transfer_call
    FOREIGN KEY (call_session_id) REFERENCES call_sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_call_transfer_from_ext
    FOREIGN KEY (from_extension_id) REFERENCES pbx_extensions(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_call_transfer_to_ext
    FOREIGN KEY (to_extension_id) REFERENCES pbx_extensions(id)
    ON DELETE RESTRICT
);

CREATE TABLE call_dtmf_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  call_session_id BIGINT UNSIGNED NOT NULL,
  participant_id BIGINT UNSIGNED NULL,
  digit VARCHAR(4) NOT NULL,
  direction ENUM('sent','received') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dtmf_call
    FOREIGN KEY (call_session_id) REFERENCES call_sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_dtmf_participant
    FOREIGN KEY (participant_id) REFERENCES call_participants(id)
    ON DELETE SET NULL
);

CREATE TABLE call_hold_states (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  call_session_id BIGINT UNSIGNED NOT NULL,
  participant_id BIGINT UNSIGNED NULL,
  hold_started_at DATETIME NOT NULL,
  hold_ended_at DATETIME NULL,
  hold_music_class VARCHAR(60) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hold_call
    FOREIGN KEY (call_session_id) REFERENCES call_sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_hold_participant
    FOREIGN KEY (participant_id) REFERENCES call_participants(id)
    ON DELETE SET NULL
);

CREATE TABLE doorphone_units (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL,
  building VARCHAR(120) NULL,
  location_description VARCHAR(255) NULL,
  extension_id BIGINT UNSIGNED NOT NULL,
  camera_url VARCHAR(255) NULL,
  unlock_relay_type ENUM('http','mqtt','gpio','none') NOT NULL DEFAULT 'none',
  unlock_relay_target VARCHAR(255) NULL,
  allowed_target_type ENUM('extension','ring_group','queue') NOT NULL DEFAULT 'extension',
  allowed_target_id VARCHAR(60) NULL,
  auto_answer_enabled TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('active','inactive','maintenance') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doorphone_extension
    FOREIGN KEY (extension_id) REFERENCES pbx_extensions(id)
    ON DELETE RESTRICT
);

CREATE TABLE doorphone_access_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doorphone_unit_id BIGINT UNSIGNED NOT NULL,
  call_session_id BIGINT UNSIGNED NULL,
  event_type ENUM('button_press','call_started','call_answered','unlock_sent','unlock_confirmed','unlock_failed','call_ended') NOT NULL,
  triggered_by_user_id BIGINT UNSIGNED NULL,
  payload_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doorphone_log_unit
    FOREIGN KEY (doorphone_unit_id) REFERENCES doorphone_units(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_doorphone_log_call
    FOREIGN KEY (call_session_id) REFERENCES call_sessions(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_doorphone_log_user
    FOREIGN KEY (triggered_by_user_id) REFERENCES system_users(id)
    ON DELETE SET NULL
);

CREATE TABLE pbx_sync_jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sync_type ENUM('extension_push','extension_pull','presence_pull','cdr_pull','doorphone_push') NOT NULL,
  reference_table VARCHAR(60) NULL,
  reference_id BIGINT UNSIGNED NULL,
  status ENUM('pending','running','success','failed') NOT NULL DEFAULT 'pending',
  request_payload JSON NULL,
  response_payload JSON NULL,
  error_message TEXT NULL,
  started_at DATETIME NULL,
  finished_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ari_event_queue (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_name VARCHAR(120) NOT NULL,
  channel_id VARCHAR(120) NULL,
  bridge_id VARCHAR(120) NULL,
  raw_payload JSON NOT NULL,
  processed TINYINT(1) NOT NULL DEFAULT 0,
  processed_at DATETIME NULL,
  process_error TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pbx_extensions_person_id ON pbx_extensions(person_id);
CREATE INDEX idx_pbx_extensions_status ON pbx_extensions(status);
CREATE INDEX idx_pbx_devices_extension_id ON pbx_extension_devices(extension_id);
CREATE INDEX idx_presence_extension_id ON pbx_extension_presence(extension_id);
CREATE INDEX idx_call_sessions_started_at ON call_sessions(started_at);
CREATE INDEX idx_call_sessions_source_ext ON call_sessions(source_extension_id);
CREATE INDEX idx_call_sessions_target_ext ON call_sessions(target_extension_id);
CREATE INDEX idx_call_sessions_linkedid ON call_sessions(linkedid);
CREATE INDEX idx_call_events_call_id ON call_events(call_session_id);
CREATE INDEX idx_ari_queue_processed ON ari_event_queue(processed, created_at);
CREATE INDEX idx_sync_jobs_status ON pbx_sync_jobs(status, created_at);
```

---

## 2) Seeds iniciais

Estes seeds já deixam o ambiente utilizável para teste.

```sql
INSERT INTO people (type, full_name, email, phone_mobile, status) VALUES
('admin', 'Administrador Geral', 'admin@interno.local', '000000000', 'active'),
('concierge', 'Portaria Principal', 'portaria@interno.local', '000000001', 'active'),
('resident', 'Morador Apto 201', 'apto201@interno.local', '000000201', 'active'),
('resident', 'Morador Apto 202', 'apto202@interno.local', '000000202', 'active');

INSERT INTO system_users (person_id, username, password_hash, role, is_active) VALUES
(1, 'admin', '$2b$12$trocar_hash_real', 'admin', 1),
(2, 'portaria', '$2b$12$trocar_hash_real', 'concierge', 1),
(3, 'apto201', '$2b$12$trocar_hash_real', 'resident', 1),
(4, 'apto202', '$2b$12$trocar_hash_real', 'resident', 1);

INSERT INTO pbx_extensions (
  person_id, extension_number, display_name, extension_type, secret_ref,
  callerid_name, callerid_number, sip_username, webrtc_enabled, voicemail_enabled,
  outbound_enabled, internal_only, status, freepbx_extension_id
) VALUES
(2, '2000', 'Portaria Principal', 'webrtc', NULL, 'Portaria', '2000', '2000', 1, 0, 0, 1, 'active', '2000'),
(3, '2201', 'Apto 201', 'webrtc', NULL, 'Apto 201', '2201', '2201', 1, 0, 0, 1, 'active', '2201'),
(4, '2202', 'Apto 202', 'webrtc', NULL, 'Apto 202', '2202', '2202', 1, 0, 0, 1, 'active', '2202'),
(NULL, '2999', 'Porteiro Bloco A', 'doorphone', NULL, 'Porteiro A', '2999', '2999', 0, 0, 0, 1, 'active', '2999');

INSERT INTO internal_contacts (
  person_id, extension_id, label, department, contact_type, speed_dial_code, sort_order, visible_to_role, is_favorite_default, status
) VALUES
(2, 1, 'Portaria Principal', 'Portaria', 'security', '1', 1, 'all', 1, 'active'),
(3, 2, 'Apto 201', 'Residencial', 'resident', '201', 2, 'all', 0, 'active'),
(4, 3, 'Apto 202', 'Residencial', 'resident', '202', 3, 'all', 0, 'active'),
(NULL, 4, 'Porteiro Bloco A', 'Acesso', 'doorphone', '99', 4, 'all', 1, 'active');

INSERT INTO doorphone_units (
  code, label, building, location_description, extension_id, camera_url,
  unlock_relay_type, unlock_relay_target, allowed_target_type, allowed_target_id,
  auto_answer_enabled, status
) VALUES
('DOOR-A', 'Porteiro Bloco A', 'Bloco A', 'Entrada principal do bloco A', 4, NULL,
 'http', 'http://192.168.60.50/unlock', 'extension', '2000', 0, 'active');

INSERT INTO pbx_extension_presence (extension_id, device_id, registration_state, call_state, do_not_disturb) VALUES
(1, NULL, 'unknown', 'idle', 0),
(2, NULL, 'unknown', 'idle', 0),
(3, NULL, 'unknown', 'idle', 0),
(4, NULL, 'unknown', 'idle', 0);
```

---

## 3) Estrutura final das rotas

```text
src/app/api/softphone/
  extensions/
    route.ts
    [id]/route.ts
    [id]/provision/route.ts
  contacts/route.ts
  presence/route.ts
  presence/[extension]/route.ts
  calls/
    dial/route.ts
    active/route.ts
    [id]/answer/route.ts
    [id]/hangup/route.ts
    [id]/mute/route.ts
    [id]/unmute/route.ts
    [id]/hold/route.ts
    [id]/unhold/route.ts
    [id]/dtmf/route.ts
    [id]/transfer/route.ts
  doorphones/
    route.ts
    [id]/call/route.ts
    [id]/unlock/route.ts
  events/
    sse/route.ts
```

---

## 4) Rotas reais restantes

### Hangup

```ts
// src/app/api/softphone/calls/[id]/hangup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ariClient } from "@/lib/softphone/ari/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [rows]: any = await db.query(
    `SELECT ari_channel_id FROM call_sessions WHERE id = ? LIMIT 1`,
    [id]
  );

  const call = rows?.[0];
  if (!call?.ari_channel_id) {
    return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
  }

  await ariClient.hangup(call.ari_channel_id);

  return NextResponse.json({ success: true });
}
```

### Hold

```ts
// src/app/api/softphone/calls/[id]/hold/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ariClient } from "@/lib/softphone/ari/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [rows]: any = await db.query(
    `SELECT ari_channel_id FROM call_sessions WHERE id = ? LIMIT 1`,
    [id]
  );

  const call = rows?.[0];
  if (!call?.ari_channel_id) {
    return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
  }

  await ariClient.hold(call.ari_channel_id);

  await db.query(
    `INSERT INTO call_hold_states (call_session_id, hold_started_at)
     VALUES (?, NOW())`,
    [id]
  );

  await db.query(
    `INSERT INTO call_events (call_session_id, event_type, event_source, payload_json)
     VALUES (?, 'hold', 'user', JSON_OBJECT('action', 'hold'))`,
    [id]
  );

  return NextResponse.json({ success: true });
}
```

### Unhold

```ts
// src/app/api/softphone/calls/[id]/unhold/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ariClient } from "@/lib/softphone/ari/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [rows]: any = await db.query(
    `SELECT ari_channel_id FROM call_sessions WHERE id = ? LIMIT 1`,
    [id]
  );

  const call = rows?.[0];
  if (!call?.ari_channel_id) {
    return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
  }

  await ariClient.unhold(call.ari_channel_id);

  await db.query(
    `UPDATE call_hold_states
     SET hold_ended_at = NOW()
     WHERE call_session_id = ? AND hold_ended_at IS NULL
     ORDER BY id DESC
     LIMIT 1`,
    [id]
  );

  await db.query(
    `INSERT INTO call_events (call_session_id, event_type, event_source, payload_json)
     VALUES (?, 'unhold', 'user', JSON_OBJECT('action', 'unhold'))`,
    [id]
  );

  return NextResponse.json({ success: true });
}
```

### Mute

```ts
// src/app/api/softphone/calls/[id]/mute/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ariClient } from "@/lib/softphone/ari/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { direction = "both" } = await req.json();
  const { id } = await params;

  const [rows]: any = await db.query(
    `SELECT ari_channel_id FROM call_sessions WHERE id = ? LIMIT 1`,
    [id]
  );

  const call = rows?.[0];
  if (!call?.ari_channel_id) {
    return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
  }

  await ariClient.mute(call.ari_channel_id, direction);

  await db.query(
    `INSERT INTO call_events (call_session_id, event_type, event_source, payload_json)
     VALUES (?, 'mute', 'user', JSON_OBJECT('direction', ?))`,
    [id, direction]
  );

  return NextResponse.json({ success: true });
}
```

### Unmute

```ts
// src/app/api/softphone/calls/[id]/unmute/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ariClient } from "@/lib/softphone/ari/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { direction = "both" } = await req.json();
  const { id } = await params;

  const [rows]: any = await db.query(
    `SELECT ari_channel_id FROM call_sessions WHERE id = ? LIMIT 1`,
    [id]
  );

  const call = rows?.[0];
  if (!call?.ari_channel_id) {
    return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
  }

  await ariClient.unmute(call.ari_channel_id, direction);

  await db.query(
    `INSERT INTO call_events (call_session_id, event_type, event_source, payload_json)
     VALUES (?, 'unmute', 'user', JSON_OBJECT('direction', ?))`,
    [id, direction]
  );

  return NextResponse.json({ success: true });
}
```

### Transferência cega

```ts
// src/app/api/softphone/calls/[id]/transfer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ariClient } from "@/lib/softphone/ari/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { toExtension, type = "blind" } = await req.json();
  const { id } = await params;

  const [callRows]: any = await db.query(
    `SELECT ari_channel_id, source_extension_id FROM call_sessions WHERE id = ? LIMIT 1`,
    [id]
  );
  const [targetRows]: any = await db.query(
    `SELECT id, extension_number FROM pbx_extensions WHERE extension_number = ? LIMIT 1`,
    [toExtension]
  );

  const call = callRows?.[0];
  const target = targetRows?.[0];

  if (!call?.ari_channel_id) {
    return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
  }
  if (!target) {
    return NextResponse.json({ error: "Destino inválido" }, { status: 404 });
  }
  if (type !== "blind") {
    return NextResponse.json({ error: "Somente blind transfer nesta v1" }, { status: 400 });
  }

  await db.query(
    `INSERT INTO call_transfers
     (call_session_id, transfer_type, from_extension_id, to_extension_id, started_at, status)
     VALUES (?, 'blind', ?, ?, NOW(), 'initiated')`,
    [id, call.source_extension_id, target.id]
  );

  await db.query(
    `INSERT INTO call_events (call_session_id, event_type, event_source, payload_json)
     VALUES (?, 'transfer_start', 'user', JSON_OBJECT('toExtension', ?))`,
    [id, toExtension]
  );

  await ariClient.blindTransfer(call.ari_channel_id, `PJSIP/${target.extension_number}`);

  await db.query(
    `UPDATE call_transfers
     SET completed_at = NOW(), status = 'completed'
     WHERE call_session_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [id]
  );

  await db.query(
    `INSERT INTO call_events (call_session_id, event_type, event_source, payload_json)
     VALUES (?, 'transfer_complete', 'user', JSON_OBJECT('toExtension', ?))`,
    [id, toExtension]
  );

  return NextResponse.json({ success: true });
}
```

### Active calls

```ts
// src/app/api/softphone/calls/active/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [rows]: any = await db.query(
    `SELECT
       cs.*,
       se.extension_number AS source_extension,
       te.extension_number AS target_extension
     FROM call_sessions cs
     LEFT JOIN pbx_extensions se ON se.id = cs.source_extension_id
     LEFT JOIN pbx_extensions te ON te.id = cs.target_extension_id
     WHERE cs.final_status IN ('initiated','ringing','answered') 
     ORDER BY cs.started_at DESC`
  );

  return NextResponse.json(rows);
}
```

### Directory / contacts

```ts
// src/app/api/softphone/contacts/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [rows]: any = await db.query(
    `SELECT
      ic.*,
      pe.full_name,
      ex.extension_number,
      ex.status AS extension_status
     FROM internal_contacts ic
     LEFT JOIN people pe ON pe.id = ic.person_id
     LEFT JOIN pbx_extensions ex ON ex.id = ic.extension_id
     WHERE ic.status = 'active'
     ORDER BY ic.sort_order ASC, ic.label ASC`
  );

  return NextResponse.json(rows);
}
```

### Presence

```ts
// src/app/api/softphone/presence/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [rows]: any = await db.query(
    `SELECT
      p.*,
      e.extension_number,
      e.display_name
     FROM pbx_extension_presence p
     INNER JOIN pbx_extensions e ON e.id = p.extension_id
     ORDER BY e.extension_number ASC`
  );

  return NextResponse.json(rows);
}
```

### Unlock do porteiro

```ts
// src/app/api/softphone/doorphones/[id]/unlock/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { triggeredByUserId, callSessionId = null } = await req.json();
  const { id } = await params;

  const [rows]: any = await db.query(
    `SELECT * FROM doorphone_units WHERE id = ? LIMIT 1`,
    [id]
  );
  const unit = rows?.[0];

  if (!unit) {
    return NextResponse.json({ error: "Porteiro não encontrado" }, { status: 404 });
  }

  if (unit.unlock_relay_type !== "http" || !unit.unlock_relay_target) {
    return NextResponse.json({ error: "Relé não configurado para HTTP" }, { status: 400 });
  }

  try {
    const relayRes = await fetch(unit.unlock_relay_target, { method: "POST" });

    await db.query(
      `INSERT INTO doorphone_access_logs
       (doorphone_unit_id, call_session_id, event_type, triggered_by_user_id, payload_json)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        callSessionId,
        relayRes.ok ? "unlock_confirmed" : "unlock_failed",
        triggeredByUserId ?? null,
        JSON.stringify({ status: relayRes.status }),
      ]
    );

    return NextResponse.json({ success: relayRes.ok });
  } catch (error: any) {
    await db.query(
      `INSERT INTO doorphone_access_logs
       (doorphone_unit_id, call_session_id, event_type, triggered_by_user_id, payload_json)
       VALUES (?, ?, 'unlock_failed', ?, ?)`,
      [id, callSessionId, triggeredByUserId ?? null, JSON.stringify({ error: error.message })]
    );

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

---

## 5) Worker ARI executável

O ARI é assíncrono por natureza e foi desenhado para apps externas controlarem **channels**, **bridges** e eventos em tempo real; o worker abaixo segue esse desenho oficial. ([Asterisk Docs][2])

```ts
// src/lib/softphone/ari/ws-listener.ts
import WebSocket from "ws";
import { handleAriEvent } from "./event-handler";

const ARI_WS_URL = process.env.ARI_WS_URL!;
const ARI_USERNAME = process.env.ARI_USERNAME!;
const ARI_PASSWORD = process.env.ARI_PASSWORD!;
const ARI_APP_NAME = process.env.ARI_APP_NAME!;

export function startAriListener() {
  const auth = Buffer.from(`${ARI_USERNAME}:${ARI_PASSWORD}`).toString("base64");

  const ws = new WebSocket(
    `${ARI_WS_URL}/events?app=${encodeURIComponent(ARI_APP_NAME)}`,
    {
      headers: { Authorization: `Basic ${auth}` },
    }
  );

  ws.on("open", () => console.log("[ARI] conectado"));
  ws.on("message", async (data) => {
    try {
      await handleAriEvent(JSON.parse(data.toString()));
    } catch (err) {
      console.error("[ARI] erro ao tratar evento", err);
    }
  });

  ws.on("close", () => {
    console.warn("[ARI] desconectado; reconectando em 5s");
    setTimeout(startAriListener, 5000);
  });

  ws.on("error", (err) => {
    console.error("[ARI] websocket error", err);
  });
}
```

```ts
// src/lib/softphone/ari/event-handler.ts
import { db } from "@/lib/db";

async function saveRaw(event: any) {
  await db.query(
    `INSERT INTO ari_event_queue (event_name, channel_id, bridge_id, raw_payload)
     VALUES (?, ?, ?, ?)`,
    [
      event.type ?? "unknown",
      event.channel?.id ?? null,
      event.bridge?.id ?? null,
      JSON.stringify(event),
    ]
  );
}

export async function handleAriEvent(event: any) {
  await saveRaw(event);

  const channelId = event.channel?.id ?? null;

  if (event.type === "StasisStart") {
    const callSessionId = Number(
      (event.args || []).find((x: string) => String(x).startsWith("callSessionId="))
        ?.split("=")[1] || 0
    );

    if (callSessionId) {
      await db.query(
        `UPDATE call_sessions
         SET final_status = 'ringing'
         WHERE id = ?`,
        [callSessionId]
      );

      await db.query(
        `INSERT INTO call_events (call_session_id, event_type, event_source, payload_json)
         VALUES (?, 'ringing', 'ari', ?)`,
        [callSessionId, JSON.stringify(event)]
      );
    }
    return;
  }

  if (event.type === "ChannelStateChange" && channelId) {
    const [rows]: any = await db.query(
      `SELECT id FROM call_sessions WHERE ari_channel_id = ? LIMIT 1`,
      [channelId]
    );
    const call = rows?.[0];
    if (!call) return;

    if (event.channel?.state === "Up") {
      await db.query(
        `UPDATE call_sessions
         SET answered_at = NOW(), final_status = 'answered'
         WHERE id = ?`,
        [call.id]
      );

      await db.query(
        `INSERT INTO call_events (call_session_id, event_type, event_source, payload_json)
         VALUES (?, 'answered', 'ari', ?)`,
        [call.id, JSON.stringify(event)]
      );
    }
    return;
  }

  if (event.type === "ChannelDtmfReceived" && channelId) {
    const [rows]: any = await db.query(
      `SELECT id FROM call_sessions WHERE ari_channel_id = ? LIMIT 1`,
      [channelId]
    );
    const call = rows?.[0];
    if (!call) return;

    await db.query(
      `INSERT INTO call_dtmf_events (call_session_id, digit, direction)
       VALUES (?, ?, 'received')`,
      [call.id, event.digit]
    );

    await db.query(
      `INSERT INTO call_events (call_session_id, event_type, event_source, payload_json)
       VALUES (?, 'dtmf', 'ari', ?)`,
      [call.id, JSON.stringify(event)]
    );
    return;
  }

  if (event.type === "StasisEnd" && channelId) {
    const [rows]: any = await db.query(
      `SELECT id, answered_at FROM call_sessions WHERE ari_channel_id = ? LIMIT 1`,
      [channelId]
    );
    const call = rows?.[0];
    if (!call) return;

    const finalStatus = call.answered_at ? "ended" : "missed";

    await db.query(
      `UPDATE call_sessions
       SET ended_at = NOW(), final_status = ?
       WHERE id = ?`,
      [finalStatus, call.id]
    );

    await db.query(
      `INSERT INTO call_events (call_session_id, event_type, event_source, payload_json)
       VALUES (?, 'hangup', 'ari', ?)`,
      [call.id, JSON.stringify(event)]
    );
  }
}
```

### Bootstrap do worker

```ts
// src/server/softphone-worker.ts
import { startAriListener } from "@/lib/softphone/ari/ws-listener";

async function bootstrap() {
  console.log("[Softphone Worker] iniciando...");
  startAriListener();
}

bootstrap().catch((err) => {
  console.error("[Softphone Worker] erro fatal", err);
  process.exit(1);
});
```

No `package.json`:

```json
{
  "scripts": {
    "softphone:worker": "tsx src/server/softphone-worker.ts"
  }
}
```

---

## 6) SSE interno para atualização em tempo real

```ts
// src/app/api/softphone/events/sse/route.ts
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));
      }, 15000);

      const cleanup = () => clearInterval(interval);
      // manter simples nesta v1
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
```

Para v1, eu usaria SSE para refletir:

* presença
* chamadas ativas
* mudanças de estado

---

## 7) Componente React do discador

O SIP.js foi feito exatamente para criar o agente SIP, registrar no servidor e tratar `INVITE` em chamadas recebidas. ([SIP.js][3])

```tsx
// src/components/softphone/SoftphonePanel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  UserAgent,
  Registerer,
  Inviter,
  Invitation,
  SessionState
} from "sip.js";

type Props = {
  extension: string;
  password: string;
  domain: string;
  wsServer: string;
};

export default function SoftphonePanel({
  extension,
  password,
  domain,
  wsServer,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const uaRef = useRef<UserAgent | null>(null);
  const registererRef = useRef<Registerer | null>(null);
  const sessionRef = useRef<any>(null);

  const [registered, setRegistered] = useState(false);
  const [dialNumber, setDialNumber] = useState("");
  const [status, setStatus] = useState("offline");
  const [incoming, setIncoming] = useState<Invitation | null>(null);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const uri = UserAgent.makeURI(`sip:${extension}@${domain}`);
      if (!uri) return;

      const ua = new UserAgent({
        uri,
        transportOptions: { server: wsServer },
        authorizationUsername: extension,
        authorizationPassword: password,
        delegate: {
          onInvite: (invitation) => {
            setIncoming(invitation);
            setStatus("ringing");
          },
        },
      });

      await ua.start();

      const registerer = new Registerer(ua);
      await registerer.register();

      if (!mounted) return;

      uaRef.current = ua;
      registererRef.current = registerer;
      setRegistered(true);
      setStatus("idle");
    }

    boot();

    return () => {
      mounted = false;
      registererRef.current?.unregister().catch(() => {});
      uaRef.current?.stop().catch(() => {});
    };
  }, [extension, password, domain, wsServer]);

  async function attachRemoteMedia(session: any) {
    const sdh: any = session.sessionDescriptionHandler;
    const pc = sdh?.peerConnection;
    if (!pc || !audioRef.current) return;

    const remoteStream = new MediaStream();
    pc.getReceivers().forEach((receiver: RTCRtpReceiver) => {
      if (receiver.track) remoteStream.addTrack(receiver.track);
    });

    audioRef.current.srcObject = remoteStream;
    await audioRef.current.play().catch(() => {});
  }

  async function makeCall() {
    if (!uaRef.current || !dialNumber) return;

    const target = UserAgent.makeURI(`sip:${dialNumber}@${domain}`);
    if (!target) return;

    const inviter = new Inviter(uaRef.current, target, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    });

    inviter.stateChange.addListener(async (state) => {
      if (state === SessionState.Establishing) setStatus("calling");
      if (state === SessionState.Established) {
        sessionRef.current = inviter;
        setStatus("in_call");
        await attachRemoteMedia(inviter);
      }
      if (state === SessionState.Terminated) {
        sessionRef.current = null;
        setStatus("idle");
      }
    });

    await inviter.invite();
  }

  async function answerCall() {
    if (!incoming) return;

    incoming.stateChange.addListener(async (state) => {
      if (state === SessionState.Established) {
        sessionRef.current = incoming;
        setStatus("in_call");
        await attachRemoteMedia(incoming);
      }
      if (state === SessionState.Terminated) {
        sessionRef.current = null;
        setIncoming(null);
        setStatus("idle");
      }
    });

    await incoming.accept({
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    });
  }

  async function endCall() {
    const session = sessionRef.current || incoming;
    if (!session) return;

    if (session.state === SessionState.Initial) {
      await session.cancel();
    } else {
      await session.bye();
    }

    sessionRef.current = null;
    setIncoming(null);
    setStatus("idle");
  }

  return (
    <div className="rounded-2xl border p-4 space-y-4 bg-white text-black shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Softphone</div>
          <div className="text-sm opacity-70">
            Ramal {extension} · {registered ? "registrado" : "não registrado"}
          </div>
        </div>
        <div className="text-sm font-medium">{status}</div>
      </div>

      <input
        value={dialNumber}
        onChange={(e) => setDialNumber(e.target.value)}
        placeholder="Digite o ramal"
        className="w-full rounded-xl border px-3 py-2"
      />

      <div className="flex gap-2">
        <button onClick={makeCall} className="rounded-xl border px-4 py-2">
          Ligar
        </button>
        <button onClick={endCall} className="rounded-xl border px-4 py-2">
          Encerrar
        </button>
        {incoming && (
          <button onClick={answerCall} className="rounded-xl border px-4 py-2">
            Atender
          </button>
        )}
      </div>

      <audio ref={audioRef} autoPlay />
    </div>
  );
}
```

---

## 8) Ligação prática com Asterisk / FreePBX

### Asterisk WebRTC / PJSIP

O Asterisk documenta explicitamente que clientes WebRTC exigem:

* servidor HTTPS/TLS
* transporte PJSIP por WebSocket
* objetos `endpoint`, `auth` e `aor` para o cliente. ([Asterisk Docs][1])

### ARI / Stasis

O ARI trabalha com:

* REST para comandar canais
* WebSocket para eventos
* Stasis para entregar o canal à sua aplicação. ([Asterisk Docs][4])

### FreePBX

Para provisionamento automatizado, o caminho mais consistente é encapsular tudo num serviço que fale com o FreePBX via GraphQL e só depois aplique `reload`, exatamente como o tutorial oficial demonstra. ([FreePBX - Let Freedom Ring][5])

---

## 9) Arquivos de ambiente

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=property_softphone
DB_USER=softphone_user
DB_PASSWORD=strong_password

ARI_BASE_URL=http://192.168.60.10:8088/ari
ARI_WS_URL=ws://192.168.60.10:8088/ari
ARI_USERNAME=softphoneari
ARI_PASSWORD=senha_forte
ARI_APP_NAME=softphone-app

FREEPBX_URL=https://pbx.seudominio.local
FREEPBX_TOKEN=token_graphql_freepbx

NEXT_PUBLIC_SIP_DOMAIN=pbx.seudominio.local
NEXT_PUBLIC_SIP_WS_SERVER=wss://pbx.seudominio.local:8089/ws
```

---

## 10) O que está fechado nesta fase

Com o que entreguei agora, você já tem:

* **modelo relacional consolidado**
* **DDL pronto**
* **seed inicial**
* **rotas reais do backend**
* **worker ARI**
* **componente React do discador**
* **estrutura certa para integração com FreePBX e Asterisk**

---

## 11) Próxima etapa ideal

Agora o passo mais lógico é eu seguir com o bloco final de implantação prática:

* **`pjsip.conf` / `http.conf` / `extensions_custom.conf`**
* **dialplan Stasis completo**
* **cliente `freepbx-client.ts` ajustado para mutation real**
* **serviço de provisionamento completo**
* **presença em tempo real**
* **painel visual do ramal no Next.js**

Na próxima resposta eu posso entrar direto nessa etapa final e fechar a integração prática com o PBX.

[1]: https://docs.asterisk.org/Configuration/WebRTC/Configuring-Asterisk-for-WebRTC-Clients/?utm_source=chatgpt.com "Configuring Asterisk for WebRTC Clients"
[2]: https://docs.asterisk.org/Configuration/Interfaces/Asterisk-REST-Interface-ARI/?utm_source=chatgpt.com "Overview - Asterisk Documentation"
[3]: https://sipjs.com/guides/receive-call/?utm_source=chatgpt.com "Receive a Call"
[4]: https://docs.asterisk.org/Configuration/Interfaces/Asterisk-REST-Interface-ARI/Getting-Started-with-ARI/?utm_source=chatgpt.com "Getting Started with ARI"
[5]: https://www.freepbx.org/freepbx-graphql-provisioning-tutorial/?utm_source=chatgpt.com "FreePBX GraphQL Provisioning Tutorial"

Fechado.

O módulo Softphone ficou estruturado com:

* modelo relacional completo
* schema SQL consolidado
* seeds iniciais
* APIs reais para extensões, chamadas, presença, contatos e porteiro
* worker ARI para eventos e atualização de chamadas
* componente React base do softphone
* arquitetura de integração com Next.js + Asterisk/FreePBX + WebRTC

A linha-mestra ficou assim:

* **Next.js** controla autenticação, regras, diretório e UI
* **banco próprio do módulo** guarda estado, logs, presença e histórico
* **FreePBX/Asterisk** cuida de ramais, SIP/PJSIP e telefonia
* **ARI** controla chamadas em tempo real
* **SIP.js** registra o navegador como ramal WebRTC

Quando voltarmos a esse módulo, o próximo bloco natural é:

* fechar os arquivos do Asterisk (`pjsip`, `http`, `extensions_custom`)
* amarrar o provisionamento real no FreePBX
* finalizar presença em tempo real
* montar a tela operacional completa do ramal

Agora podemos voltar ao **Servidor Mikrotik**. Me passe de qual ponto você quer retomar e eu sigo direto dali.
